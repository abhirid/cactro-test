
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';

// function to get GitHub data
const getGithubData = async (url) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : 'Error fetching data from GitHub');
    }
  };
  
  // Route to show general GitHub activity log
  app.get('/github', async (req, res) => {
    try {
      const userResponse = await getGithubData(`${GITHUB_API_URL}/users/${process.env.GITHUB_USERNAME}`);
      const reposResponse = await getGithubData(`${GITHUB_API_URL}/users/${process.env.GITHUB_USERNAME}/repos`);
  
      const responseData = {
        followers: userResponse.followers,
        following: userResponse.following,
        repos: reposResponse.map((repo) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
        })),
      };
  
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Route to show specific repo data
  app.get('/github/:repoName', async (req, res) => {
    const { repoName } = req.params;
    try {
      const repoResponse = await getGithubData(`${GITHUB_API_URL}/repos/${process.env.GITHUB_USERNAME}/${repoName}`);
      res.json({
        name: repoResponse.name,
        description: repoResponse.description,
        stars: repoResponse.stargazers_count,
        forks: repoResponse.forks_count,
        issues_url: repoResponse.issues_url,
      });
    } catch (error) {
      res.status(404).json({ error: `Repository '${repoName}' not found` });
    }
  });
  
  // Route to create an issue in a specific repository

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.post('/github/:repoName/issues', express.json(), async (req, res) => {
  const { repoName } = req.params;
  const { title, body } = req.body;

  // Validate that title is provided
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Validate that body is provided
  if (!body) {
    return res.status(400).json({ error: 'Body is required' });
  }

  // Ensure GitHub credentials are set
  if (!GITHUB_USERNAME || !GITHUB_TOKEN) {
    return res.status(500).json({
      error: 'GitHub authentication details are missing',
      message: 'Please check if GITHUB_USERNAME and GITHUB_TOKEN are properly set in the environment variables.',
    });
  }

  // Construct the URL for the GitHub API
  const issueUrl = `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/issues`;
  try {
    // Data to create the issue
    const issueData = {
      title,
      body,
    };

    // Send POST request to GitHub API to create the issue
    const issueResponse = await axios.post(
      issueUrl,
      issueData,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );

    res.json({ issueUrl: issueResponse.data.html_url });
  } catch (error) {

    console.error('GitHub API Error:', error.response ? error.response.data : error.message);

    // Handle specific errors
    if (error.response) {
      if (error.response.status === 404) {

        return res.status(404).json({
          error: 'Repository not found',
          message: `The repository '${repoName}' under the user '${GITHUB_USERNAME}' could not be found.`,
          details: error.response.data,
        });
      }

      if (error.response.status === 401) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'GitHub token is invalid or does not have required permissions.',
          details: error.response.data,
        });
      }

      if (error.response.status === 422) {
        return res.status(422).json({
          error: 'Unprocessable Entity',
          message: 'The data provided for the issue may be invalid. Please check the title and body format.',
          details: error.response.data,
        });
      }
    }

    // Generic error message for other issues
    res.status(500).json({
      error: 'Error creating the issue',
      message: error.message,
      details: error.response ? error.response.data : error.message,
    });
  }
});


  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });   