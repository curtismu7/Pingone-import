import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Path to settings file
const SETTINGS_PATH = join(__dirname, "../data/settings.json");

// Helper function to read settings
async function readSettings() {
    // First, check environment variables
    const envSettings = {
        environmentId: process.env.PINGONE_ENVIRONMENT_ID || "",
        apiClientId: process.env.PINGONE_CLIENT_ID || "",
        apiSecret: process.env.PINGONE_CLIENT_SECRET ? `enc:${Buffer.from(process.env.PINGONE_CLIENT_SECRET).toString('base64')}` : "",
        populationId: process.env.PINGONE_POPULATION_ID || "",
        region: process.env.PINGONE_REGION || "NorthAmerica"
    };

    try {
        // Then try to read from settings file
        const data = await fs.readFile(SETTINGS_PATH, "utf8");
        const fileSettings = JSON.parse(data);
        
        // Merge with environment variables (env vars take precedence)
        return { ...fileSettings, ...envSettings };
    } catch (error) {
        if (error.code === "ENOENT") {
            // Return environment-based settings if file doesn't exist
            return envSettings;
        }
        throw error;
    }
}

// Get settings
router.get("/", async (req, res) => {
    try {
        const settings = await readSettings();
        
        // Log the settings being returned (without sensitive data)
        const logSettings = { ...settings };
        if (logSettings.apiSecret) {
            logSettings.apiSecret = '***';
        }
        console.log('Returning settings:', JSON.stringify(logSettings, null, 2));
        
        // Return all settings including apiSecret (it's already encrypted)
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error("Error reading settings:", error);
        res.status(500).json({
            success: false,
            error: "Failed to load settings"
        });
    }
});

// Update settings
router.post("/", express.json(), async (req, res) => {
    try {
        const newSettings = { ...req.body };
        
        // Clean up environment ID - remove any surrounding quotes or backticks
        if (newSettings.environmentId) {
            newSettings.environmentId = newSettings.environmentId
                .replace(/^[`'"]+/, '')  // Remove leading quotes/backticks
                .replace(/[`'"]+$/, ''); // Remove trailing quotes/backticks
            
            console.log('Saving environment ID:', newSettings.environmentId);
        }
        
        // Validate required fields
        if (!newSettings.environmentId || !newSettings.apiClientId) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: Environment ID and API Client ID are required"
            });
        }
        
        // Ensure we're not saving any placeholder values
        if (newSettings.environmentId === 'updated-env') {
            return res.status(400).json({
                success: false,
                error: "Please enter a valid environment ID"
            });
        }
        
        // Ensure region has a default value if not provided
        if (!newSettings.region) {
            newSettings.region = "NorthAmerica";
        }

        // Read existing settings to preserve the API secret if not provided in the update
        try {
            const existingSettings = await readSettings();
            // If apiSecret exists in existing settings but not in the update, preserve it
            if (existingSettings.apiSecret && !newSettings.apiSecret) {
                newSettings.apiSecret = existingSettings.apiSecret;
            }
        } catch (error) {
            // If we can't read existing settings, continue with the new settings as-is
            console.warn("Could not read existing settings:", error.message);
        }

        // Ensure directory exists
        const settingsDir = dirname(SETTINGS_PATH);
        await fs.mkdir(settingsDir, { recursive: true });
        
        // Save settings
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(newSettings, null, 2), "utf8");
        
        // Don't send the API secret back in the response
        const { apiSecret, ...responseSettings } = newSettings;
        
        res.json({
            success: true,
            message: "Settings saved successfully",
            data: responseSettings
        });
    } catch (error) {
        console.error("Error saving settings:", error);
        res.status(500).json({
            success: false,
            error: "Failed to save settings",
            details: error.message
        });
    }
});

export default router;
