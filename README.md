# K.J. Yesudas Tribute Website

A beautiful tribute website for legendary singer K.J. Yesudas featuring songs from multiple Indian languages with YouTube integration and Google Sheets data management.

## Features

- ✅ Multi-language support (Malayalam, Tamil, Telugu, Kannada, Hindi)
- ✅ Google Sheets integration for easy song management
- ✅ YouTube mini player for in-site video playback
- ✅ Search functionality across all song details
- ✅ Multiple filters (Genre, Composer, Co-Singer)
- ✅ Responsive design for mobile and desktop
- ✅ Beautiful gradient color scheme
- ✅ No backend required - pure HTML/CSS/JavaScript

## Setup Instructions

### Step 1: Set Up Google Sheets

1. **Create a Google Sheet** for each language with the following columns:
   - Song (Song title)
   - Movie (Film/Album name)
   - Year (Release year)
   - Composer (Music director)
   - Co-Singer (Duet partner/other singers)
   - Genre (Devotional, Film, Classical, etc.)
   - YouTube (YouTube video URL or ID)

2. **Sample Google Sheet Structure:**
   ```
   Song                      | Movie              | Year | Composer           | Co-Singer        | Genre      | YouTube
   Harivarasanam            | Swami Ayyappan     | 1975 | G. Devarajan      |                  | Devotional | https://www.youtube.com/watch?v=qQOerC1PFhU
   Swapnam Virinja Pole     | Parinayam          | 1994 | M.G. Radhakrishnan| K.S. Chithra     | Film       | https://www.youtube.com/watch?v=7yfBPGlvKhU
   ```

3. **Publish Your Google Sheet as CSV:**
   - Open your Google Sheet
   - Go to File → Share → Publish to web
   - Choose the specific sheet tab (Malayalam, Tamil, etc.)
   - Select "Comma-separated values (.csv)" format
   - Click "Publish"
   - Copy the published CSV URL

4. **Create separate sheets for:**
   - Malayalam songs
   - Tamil songs
   - Telugu songs
   - Kannada songs
   - Hindi songs

### Step 2: Configure the Website

1. **Edit `js/main.js`** and update the `SHEETS_CONFIG` object with your published CSV URLs:

```javascript
const SHEETS_CONFIG = {
    malayalam: 'https://docs.google.com/spreadsheets/d/e/YOUR_MALAYALAM_SHEET_ID/pub?output=csv',
    tamil: 'https://docs.google.com/spreadsheets/d/e/YOUR_TAMIL_SHEET_ID/pub?output=csv',
    telugu: 'https://docs.google.com/spreadsheets/d/e/YOUR_TELUGU_SHEET_ID/pub?output=csv',
    kannada: 'https://docs.google.com/spreadsheets/d/e/YOUR_KANNADA_SHEET_ID/pub?output=csv',
    hindi: 'https://docs.google.com/spreadsheets/d/e/YOUR_HINDI_SHEET_ID/pub?output=csv'
};
```

2. **Replace placeholder images** (optional):
   - Add a photo of K.J. Yesudas to the `images` folder
   - Update the `.biography-image` section in `index.html`

### Step 3: Deploy to GitHub Pages

#### Option A: Using GitHub Web Interface

1. **Create a GitHub Account** (if you don't have one):
   - Go to https://github.com
   - Sign up for a free account

2. **Create a New Repository:**
   - Click the "+" icon in top right
   - Select "New repository"
   - Name it: `yesudas-tribute` (or any name you like)
   - Make it Public
   - Don't initialize with README (we already have files)
   - Click "Create repository"

3. **Upload Files:**
   - Click "uploading an existing file"
   - Drag and drop all website files (index.html, css folder, js folder, etc.)
   - Write commit message: "Initial commit"
   - Click "Commit changes"

4. **Enable GitHub Pages:**
   - Go to repository Settings
   - Scroll to "Pages" section (left sidebar)
   - Under "Source", select "main" branch
   - Click "Save"
   - Your site will be live at: `https://YOUR_USERNAME.github.io/yesudas-tribute`

#### Option B: Using Git Command Line

1. **Initialize Git Repository:**
```bash
cd yesudas-website
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub Repository** (via website as above)

3. **Push to GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/yesudas-tribute.git
git branch -M main
git push -u origin main
```

4. **Enable GitHub Pages** (as described in Option A)

### Step 4: Add Your Songs Data

1. Start by adding a few sample songs to test
2. Make sure YouTube links are valid
3. Test the website locally first (see below)
4. Gradually add more songs to your Google Sheets
5. The website will automatically update when you refresh

### Step 5: Testing Locally (Optional)

To test the website on your computer before publishing:

1. **Install a local web server:**
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve`
   - VS Code: Use "Live Server" extension

2. **Open in browser:**
   - Navigate to `http://localhost:8000`

## Updating the Website

### Adding New Songs
1. Simply add new rows to your Google Sheets
2. The website automatically reads from the sheet
3. Refresh the page to see new songs

### Modifying Design
1. Edit `css/styles.css` for styling changes
2. Edit HTML files for structure changes
3. Commit and push changes to GitHub
4. GitHub Pages will auto-update in a few minutes

## File Structure

```
yesudas-website/
├── index.html          # Homepage
├── malayalam.html      # Malayalam songs page
├── tamil.html          # Tamil songs page
├── telugu.html         # Telugu songs page
├── kannada.html        # Kannada songs page
├── hindi.html          # Hindi songs page
├── css/
│   └── styles.css      # All styling
├── js/
│   └── main.js         # JavaScript logic and Google Sheets integration
└── images/             # Add photos here
```

## Features Explanation

### Mini Player
- Click any song card to play YouTube video in mini player
- Player appears at bottom of screen
- Minimize button (▼) to hide video while keeping it playing
- Close button (✕) to stop playback

### Search
- Search across song titles, movies, composers, and co-singers
- Real-time filtering as you type

### Filters
- **Genre Filter**: Filter by Devotional, Film, Classical, etc.
- **Composer Filter**: Filter by music director
- **Co-Singer Filter**: Filter by duet partners

### Google Sheets Integration
- No database required
- Easy to update songs
- No coding needed to add content
- Shareable with team members

## Tips for Best Results

1. **YouTube Links**: Use full URLs or just video IDs
   - ✅ Good: `https://www.youtube.com/watch?v=qQOerC1PFhU`
   - ✅ Good: `qQOerC1PFhU`
   - ❌ Bad: Broken or private video links

2. **Consistent Data**: Use consistent naming
   - Composer names: Always use same spelling
   - Genres: Use limited set (Devotional, Film, Classical, Romantic, etc.)
   - Co-singers: Full names consistently

3. **Image Optimization**: 
   - Use compressed images for faster loading
   - Recommended size: 800x600 pixels for biography photo

4. **Testing**: Always test locally before pushing to GitHub

## Troubleshooting

### Songs Not Loading
- Check that Google Sheets are published as CSV
- Verify CSV URLs are correct in `js/main.js`
- Check browser console for errors (F12)

### YouTube Videos Not Playing
- Ensure YouTube links are valid
- Check that videos are not region-restricted
- Verify video is not private or deleted

### GitHub Pages Not Updating
- Wait 5-10 minutes after pushing changes
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check GitHub Actions tab for build status

## Future Enhancements

Potential features to add:
- [ ] Playlist functionality
- [ ] Favorites/bookmark system
- [ ] Share buttons for social media
- [ ] Download links for songs
- [ ] Comments section
- [ ] Multiple photos gallery
- [ ] Biography timeline
- [ ] Awards showcase page

## Support

For questions or issues:
1. Check this README thoroughly
2. Review browser console for errors
3. Verify Google Sheets are correctly formatted
4. Test with sample data first

## Credits

Created as a tribute to the legendary playback singer K.J. Yesudas.

---

**Note**: This is a fan tribute website. All songs are linked from YouTube and belong to their respective copyright holders.