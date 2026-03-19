import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/python-analysis/analyze
 * Analyze site using Python analyzer with real API data
 * 
 * Body: { lat: number, lon: number }
 * Returns: Complete site analysis with scores and recommendations
 */
router.post('/analyze', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    
    // Validate input
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required',
        example: { lat: 14.0, lon: 75.5 }
      });
    }
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    
    if (lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }
    
    console.log(`🐍 Running Python analyzer for location: ${lat}, ${lon}`);
    
    // Run Python analyzer
    const pythonScript = path.join(__dirname, '../../site_analyzer_with_apis.py');
    const command = `python "${pythonScript}" ${lat} ${lon}`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    
    // Log any warnings from Python
    if (stderr) {
      console.log('Python warnings:', stderr);
    }
    
    // Parse and return result
    const result = JSON.parse(stdout);
    
    console.log(`✅ Analysis complete - Score: ${result.summary.suitability_score}/100`);
    
    res.json(result);
    
  } catch (error) {
    console.error('Python analysis error:', error);
    
    // Check if it's a timeout
    if (error.killed) {
      return res.status(504).json({ 
        error: 'Analysis timeout - APIs took too long to respond',
        details: 'Try again or check API connectivity'
      });
    }
    
    // Check if Python is not installed
    if (error.message.includes('python')) {
      return res.status(500).json({ 
        error: 'Python not found',
        details: 'Please install Python 3.6+ to use this feature'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze site',
      details: error.message 
    });
  }
});

/**
 * GET /api/python-analysis/test
 * Test endpoint to verify Python integration
 */
router.get('/test', async (req, res) => {
  try {
    const { stdout } = await execAsync('python --version');
    res.json({
      success: true,
      python_version: stdout.trim(),
      message: 'Python integration is working'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Python not found or not working',
      details: error.message
    });
  }
});

/**
 * POST /api/python-analysis/batch
 * Analyze multiple locations in batch
 * 
 * Body: { locations: [{ lat, lon, name }] }
 */
router.post('/batch', async (req, res) => {
  try {
    const { locations } = req.body;
    
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ 
        error: 'locations array is required',
        example: { locations: [{ lat: 14.0, lon: 75.5, name: 'Site 1' }] }
      });
    }
    
    if (locations.length > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 locations per batch request'
      });
    }
    
    console.log(`🐍 Running batch analysis for ${locations.length} locations`);
    
    const pythonScript = path.join(__dirname, '../../site_analyzer_with_apis.py');
    
    // Analyze all locations in parallel
    const results = await Promise.all(
      locations.map(async (location) => {
        try {
          const command = `python "${pythonScript}" ${location.lat} ${location.lon}`;
          const { stdout } = await execAsync(command, { timeout: 30000 });
          const result = JSON.parse(stdout);
          
          return {
            name: location.name || `Location ${location.lat}, ${location.lon}`,
            ...result
          };
        } catch (error) {
          return {
            name: location.name || `Location ${location.lat}, ${location.lon}`,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    // Sort by suitability score (highest first)
    const successfulResults = results.filter(r => r.success);
    successfulResults.sort((a, b) => 
      (b.summary?.suitability_score || 0) - (a.summary?.suitability_score || 0)
    );
    
    res.json({
      success: true,
      total: locations.length,
      successful: successfulResults.length,
      failed: results.length - successfulResults.length,
      results: results
    });
    
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze locations',
      details: error.message 
    });
  }
});

export default router;
