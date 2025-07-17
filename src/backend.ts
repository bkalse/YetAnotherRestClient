import express from 'express';
import bodyParser from 'body-parser';

const app = express();

// Start the server
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle requests
app.all('/api', (req: express.Request, res: express.Response) => {
    const method = req.method;
    const url = req.url;
    const headers = req.headers;
    const body = req.body;

    // Log the request details
    console.log(`Method: ${method}, URL: ${url}, Headers: ${JSON.stringify(headers)}, Body: ${JSON.stringify(body)}`);

    // Respond with a simple message
    res.json({
        status: 'success',
        method,
        url,
        headers,
        body,
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});