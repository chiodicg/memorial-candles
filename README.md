# Memorial Candles

A web application for lighting virtual memorial candles in memory of precious little ones. The app features a starry night background with interactive candles that can be positioned, named.

## Features

- 🕯️ Light virtual memorial candles
- ✨ Beautiful starry night background
- 🖱️ Drag and drop candles to position them
- ✏️ Click to name each candle
- 💾 Persistent storage using GitHub Gist
- 📱 Mobile-friendly touch support
- 🗑️ Remove candles when needed

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd memorial-candles
npm install
```

### 2. Configure GitHub Gist Storage (Optional)

To enable persistent storage of your candles, you'll need to set up a GitHub Personal Access Token:

1. **Create a GitHub Personal Access Token:**

   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a descriptive name like "Memorial Candles Gist Access"
   - Select the `gist` scope (this allows read/write access to your gists)
   - Click "Generate token"
   - **Important:** Copy the token immediately as you won't be able to see it again

2. **Create Environment File:**

   ```bash
   cp .env.example .env
   ```

3. **Add Your Token:**
   Edit the `.env` file and replace `your_github_token_here` with your actual token:

   ```
   VITE_GITHUB_TOKEN=ghp_your_actual_token_here
   VITE_GIST_ID=gid_of_your_gist_file
   ```

4. **Gist Configuration:**
   The app is configured to use this private Gist: `https://gist.github.com/chiodicg/0428bcc5e5be9fda9256262d8b848a2f`

   To use your own Gist:

   - Create a new Gist on GitHub
   - Update the `VITE_GIST_ID` in `.env`

### 3. Run the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Light a Candle:** Click the "Light a Candle" button to add a new candle
2. **Position Candles:** Drag candles to move them around the screen
3. **Name Candles:** Click on the "Click to name" text below each candle to add a memorial name
4. **Remove Candles:** Hover over a candle and click the X button to remove it

## Data Persistence

- **With GitHub Token:** All candle data (position, names) is automatically saved to your GitHub Gist
- **Without GitHub Token:** Candles will only persist during your current session

## Technical Details

### Project Structure

```
src/
├── components/
│   ├── Candle.jsx          # Individual candle component
│   └── StarryBackground.jsx # Animated starry background
├── services/
│   └── gistService.js      # GitHub Gist API integration
├── App.jsx                 # Main application component
├── main.jsx               # Application entry point
└── index.css              # Global styles
```

### Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **GitHub Gist API** - Data persistence

### API Integration

The app uses the GitHub Gist API to store candle data in JSON format:

```json
[{
    {
      "id": 1,
      "x": 150,
      "y": 200,
      "name": ""
    }
}]
```

## Deployment

The app is designed to work with GitHub Pages and other static hosting services:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure your environment variables are configured in your hosting platform

## Privacy & Security

- Your GitHub token is only used to access your own Gists
- No personal data is collected or transmitted except to your own GitHub Gist
- All data remains under your control in your GitHub account
- The private GIST used for the deployed app is configured to be erased every 7 days.

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
