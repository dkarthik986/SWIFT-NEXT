# Intern Frontend - Swift Message Management System

A React-based web application for managing and displaying financial SWIFT messages with format switching capabilities (MT and MX formats).

## Project Overview

This application provides a user interface for:
- Searching and filtering SWIFT financial messages
- Managing message formats (MT, MX, and ALL-MT&MX formats)
- User authentication via Login component
- Real-time message data filtering and display

## Project Structure

```
internfrontend/
├── public/                          # Static files
│   ├── index.html                  # Main HTML entry point
│   ├── manifest.json               # PWA manifest
│   └── robots.txt                  # SEO robots configuration
├── src/
│   ├── components/
│   │   ├── Login.js               # Authentication component
│   │   ├── Login.css              # Login styling
│   │   ├── Search.js              # Message search & filter component
│   │   ├── Search.css             # Search component styling
│   │   └── swiftMessages.json     # Sample SWIFT message data (151 records)
│   ├── App.js                     # Root application component
│   ├── App.css                    # Application styling
│   ├── index.js                   # React DOM render entry point
│   ├── index.css                  # Global styles
│   ├── reportWebVitals.js         # Performance monitoring
│   └── setupTests.js              # Test configuration
├── build/                          # Production build output
├── package.json                    # Project dependencies and scripts
└── README.md                       # This file
```

## Features

### Message Format Support
- **MT Format**: Traditional SWIFT message format (e.g., MT103, MT202, MT940)
- **MX Format**: ISO 20022 XML-based format (e.g., pacs.008, pain.001)
- **ALL-MT&MX**: Combined format showing both MT and MX message types

### Core Components

#### Login Component
- User authentication interface
- Session management
- Credential validation

#### Search Component
- Advanced filtering by multiple criteria:
  - Format type (MT, MX, ALL-MT&MX)
  - Message status (DELIVERED, PENDING, FAILED, etc.)
  - Direction (INCOMING, OUTGOING)
  - Network type (SWIFT-INTERACT, SWIFT-FIN, SWIFT-FILEACT)
  - Date range selection
- Real-time search functionality
- Message list display with pagination support

### Sample Data
The application includes 151 sample SWIFT message records (`swiftMessages.json`) with:
- Unique message identifiers
- Sender/receiver information
- Amount and currency details
- Processing status and phase
- Compliance and risk indicators

## Installation

### Prerequisites
- Node.js (v14.0 or higher)
- npm (v6.0 or higher)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   The application will open at [http://localhost:3000](http://localhost:3000)

3. **Build for Production**
   ```bash
   npm run build
   ```
   Creates an optimized production build in the `build/` directory

## Available Scripts

- `npm start` - Runs the app in development mode with hot reload
- `npm run build` - Builds the app for production with optimizations
- `npm test` - Launches the test runner in interactive watch mode
- `npm run eject` - Ejects from Create React App (irreversible)

## Data Structure

### Message Object Format
```json
{
  "id": 1,
  "format": "ALL-MT&MX",
  "type": "MT202COV / pacs.009",
  "date": "2023/08/28",
  "time": "21:07:15",
  "direction": "INCOMING|OUTGOING",
  "network": "SWIFT-INTERACT|SWIFT-FIN|SWIFT-FILEACT",
  "sourceSystem": "PAYMENT HUB|MIDDLEWARE|etc",
  "sender": "SWIFT BIC Code",
  "receiver": "SWIFT BIC Code",
  "status": "DELIVERED|PENDING|FAILED|ACCEPTED|REPAIR|etc",
  "currency": "INR|EUR|USD|etc",
  "amount": 1234567.89,
  "userReference": "USER_REF",
  "rfkReference": "RFK_REF",
  "messageReference": "MSGREF",
  "uetr": "UUID",
  "finCopy": "FIN-COPY|NON-FIN-COPY",
  "action": "PROCESS|BYPASS|HOLD|CANCEL|etc",
  "reason": "MANUAL_REVIEW|AUTO_PROCESSED|etc",
  "correspondent": "BANK_CODE",
  "sequenceFrom": 1234567,
  "sequenceTo": 7654321,
  "ownerUnit": "UNIT-A|BRANCH-1|HQ",
  "freeSearchText": "",
  "backendChannel": "HUB-MAIN|SESSION-01|etc",
  "phase": "INITIAL|PROCESSING|COMPLETED|FAILED|etc"
}
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory if needed:
```
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_MESSAGE_PAGE_SIZE=10
```

### Styling
- Global styles: `src/index.css`
- Component-specific styles: `src/components/*.css`
- CSS preprocessor support available

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Recent Changes

### Format Migration (Feb 28, 2026)
- Updated all format references from `"MultiFormat"` to `"ALL-MT&MX"` across all 346 message records
- Ensures consistency with new naming convention
- Improves clarity of combined MT and MX format handling

## Development Workflow

1. Create feature branch from `main`
2. Make changes to components or styles
3. Test changes locally with `npm start`
4. Build production version with `npm run build`
5. Deploy to production environment

## Performance Optimizations

- React component optimization with memoization
- CSS module support for scoped styling
- Production build minification and code splitting
- Web Vitals monitoring integration

## Troubleshooting

### Port 3000 Already in Use
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Messages Not Loading
- Check `swiftMessages.json` file exists in `src/components/`
- Verify JSON file is valid: use online JSON validator
- Check browser console for error messages

## Deployment

### Build Artifacts
The `build/` directory contains:
- `index.html` - Main HTML file
- `static/js/` - Compiled JavaScript bundles
- `static/css/` - Compiled CSS files
- `manifest.json` - App manifest for PWA support

### Deployment Options
- **Vercel**: Zero-config deployment via Git
- **Netlify**: Easy deploy with CI/CD integration
- **Docker**: Containerized deployment (create Dockerfile if needed)
- **Traditional Web Server**: Copy `build/` contents to web server

## API Integration

To connect to a backend API:

1. Update API endpoints in components
2. Replace static `swiftMessages.json` with API calls
3. Implement error handling and loading states
4. Add authentication token management

Example:
```javascript
const fetchMessages = async () => {
  const response = await fetch('/api/messages');
  const data = await response.json();
  setMessages(data);
};
```

## Contributing

1. Follow React best practices
2. Use functional components and hooks
3. Add comments for complex logic
4. Test components before committing
5. Maintain consistent code style

## License

[Specify your license here - e.g., MIT, Apache 2.0]

## Support

For issues or questions:
- Check existing GitHub issues
- Create a new issue with detailed information
- Contact development team

## Changelog

### v1.0.0 (Feb 28, 2026)
- Initial release
- Login and Search components
- SWIFT message data model
- Format support for MT, MX, and ALL-MT&MX
- 151 sample message records
- All format references updated to ALL-MT&MX

---

**Last Updated**: February 28, 2026  
**Created By**: Development Team  
**Project Status**: Active Development

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
