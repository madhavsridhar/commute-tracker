import express from 'express';
import { CommuteSave } from '../models/CommuteSave.js';
import { cache } from '../index.js';
import { fetchCommuteTime } from '../services/googleMaps.js';
import cron from 'node-cron';

export const commuteRouter = express.Router();

const LOCATIONS = {
  HOME: "WM58%2BRM%20Haralur,%20Karnataka",
  OFFICE: "WMCQ%2B42%20Bengaluru,%20Karnataka"
};

// Function to fetch and store commute time
async function fetchAndStoreCommuteTime(direction) {
  console.log('Scheduled fetch starting...');
  const source = direction ? LOCATIONS.HOME : LOCATIONS.OFFICE;
  const destination = direction ? LOCATIONS.OFFICE : LOCATIONS.HOME;
  
  try {
    console.log('Fetching from Google Maps API...');
    const duration = await fetchCommuteTime(source, destination);
    console.log('Received duration from API:', duration);
    
    // Save to database with timeout
    console.log('Saving to database...');
    const commute = new CommuteSave({
      duration,
      source: source,
      destination: destination,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
      status: 'success'
    });

    const savePromise = commute.save();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database save timeout')), 5000)
    );

    await Promise.race([savePromise, timeoutPromise]);
    console.log('Successfully saved to database');

    // Cache the result
    // console.log('Caching result...');
    // cache.set(cacheKey, { duration });

    return duration;
  } catch (error) {
    console.error('Error in scheduled fetch:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Schedule task to run every 15 minutes between 7am and 8pm IST
cron.schedule('*/15 2-10 * * 1-5', async () => {
  console.log('Running scheduled commute time fetch...');
  try {
    await fetchAndStoreCommuteTime(true);
    console.log('Scheduled fetch completed successfully');
  } catch (error) {
    console.error('Scheduled task failed:', error);
  }
});

cron.schedule('*/15 11-15 * * 1-5', async () => {
  console.log('Running scheduled commute time fetch...');
  try {
    await fetchAndStoreCommuteTime(false);
    console.log('Scheduled fetch completed successfully');
  } catch (error) {
    console.error('Scheduled task failed:', error);
  }
});

// Test endpoint to verify route functionality
commuteRouter.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ status: 'Router is working' });
});

// Get current commute time
commuteRouter.get('/current', async (req, res, next) => {
  console.log('Current commute endpoint hit');
  
  try {
    const cacheKey = `${LOCATIONS.HOME}-${LOCATIONS.OFFICE}`;
    console.log('Checking cache for key:', cacheKey);
    
    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log('Cache hit:', cachedResult);
      return res.json(cachedResult);
    }
    
    console.log('Cache miss, fetching new data...');
    const duration = await fetchAndStoreCommuteTime();
    
    console.log('Sending response...');
    res.json({ duration });
  } catch (error) {
    console.error('Error in /current endpoint:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// Get historical data
commuteRouter.get('/history', async (req, res, next) => {
  console.log('History endpoint hit');
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await CommuteSave.find({
      timestamp: { $gte: startDate },
      status: 'success'
    })
    .limit(100)  // Add limit for safety
    .sort({ timestamp: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error in /history endpoint:', error);
    next(error);
  }
});

// Get weekly averages
commuteRouter.get('/weekly-averages', async (req, res, next) => {
  console.log('Weekly averages endpoint hit');
  try {
    const averages = await CommuteSave.aggregate([
      {
        $match: {
          status: 'success',
          timestamp: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          averageDuration: { $avg: '$duration' }
        }
      }
    ]).exec();

    res.json(averages);
  } catch (error) {
    console.error('Error in /weekly-averages endpoint:', error);
    next(error);
  }
});

// Add this new route handler
commuteRouter.get('/trends', async (req, res) => {
    try {
        const trends = await CommuteSave.find({})
            .sort({ timestamp: -1 })
            .limit(100)  // Limit to last 100 records for performance
            .select('timestamp duration source destination');
        res.json(trends);
    } catch (error) {
        console.error('Error fetching trend data:', error);
        res.status(500).json({ error: 'Failed to fetch trend data' });
    }
});