const ENV = process.env.NODE_ENV || 'development';

const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api/v1',
    REQUEST_TIMEOUT: 15000,
  },
  production: {
    API_BASE_URL: 'https://your-production-domain.com/api/v1',
    REQUEST_TIMEOUT: 15000,
  },
  test: {
    API_BASE_URL: 'http://localhost:3000/api/v1',
    REQUEST_TIMEOUT: 10000,
  },
};

export default config[ENV as keyof typeof config];
