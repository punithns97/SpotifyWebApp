const express = require('express');
const request = require('request');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const spotifyController = require('./controllers/spotify.js');
const passport = require('passport');
const session = require('express-session')
require('./middleware/passport')
const app = express();

const ejs = require('ejs');
app.set('view engine', 'ejs');
const client_id = 'd7ced1995ed04e8abb6a19c13dd9d053';
const client_secret = '60cd0573cebf48e48ad7e552c099fea8';

app.use(bodyParser.json())
app.use(express.static('public'));
app.use(cors());

app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

app.set('views', path.join(__dirname, 'views'));


function getAccessToken(callback) {
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log("getting token, body: ", body);
            const token = body.access_token;
            callback(null, token);
        } else {
            callback('Error getting access token: ' + body.error_description, null);
        }
    });
}


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/viewPlaylists', (req, res) => {
    res.redirect("/login.html")   
});

// app.get('/login',spotifyController.login)
// app.get('/callback',spotifyController.callback)


app.get('/login', 
    passport.authenticate('spotify',{
        scope : ['user-read-email']
    }),
    function(req,res){

    })

// app.get(
//     '/callback',
//     function(req, res, next) {
//         passport.authenticate('spotify', function(err, user, info) {
//         if (err) {
//             return next(err)
//         }
//         if (!user) {
//             return res.redirect('/login')
//         }
        
//         // return res.json({user, info})
//         req.session.user = user;
//         req.session.info = info;

//         res.redirect('/view');
//         })(req, res, next)
//     }
//     )  

async function fetchPlaylists(page = 1, user, info) {
    const limit = 10; // Define your desired limit here
    const offset = (page - 1) * limit;
    const userId = user.id;
    const url = `https://api.spotify.com/v1/users/${userId}/playlists?limit=${limit}&offset=${offset}`;

    

    // Check if user and info exist in the session
    if (!user || !info) {
        return res.status(400).json({ error: 'User information not found in session' });
    }

    // Extract access token from user object
    const accessToken = user.accessToken;

    // Make API request using fetch
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    // Parse response JSON
    const data = await response.json();

    return data;
}

app.get('/callback', async (req, res, next) => {
    passport.authenticate('spotify', async (err, user, info) => {
        if (err) {
            return next(err);
            // return res.redirect('/login');
        }
        if (!user) {
            return res.redirect('/login');
        }
        
        req.session.user = user;
        req.session.info = info;

        try {
            
            const playlists = await fetchPlaylists(req.session.user.access_token, user,info);
            
            
            res.render('view', { playlists });
        } catch (error) {
            console.error('Error fetching playlists:', error);
            
            res.render('error', { message: 'Error fetching playlists' });
        }
    })(req, res, next);
});



// app.get('/artist', function (req, res) {
//     getAccessToken(function(error, token) {
//         if (error) {
//             console.log("artist error");
//             res.status(500).send(error);
//         } else {
//             const options = {
//                 url: 'https://api.spotify.com/v1/artists/4Z8W4fKeB5YxbusRsdQVPb',
//                 headers: {
//                     'Authorization': 'Bearer ' + token
//                 },
//                 json: true
//             };

//             console.log("making call to spotify");
    
//             request.get(options, function(error, response, body) {
//                 console.log("here", body);
//                 if (!error && response.statusCode === 200) {
//                     res.send(body);
//                 } else if (!error) {
//                     res.send(body);
//                 } else {
//                     console.log("error here1?");
//                     console.error(error);
//                     console.log(body);
//                     res.status(response.statusCode).send('Error: ' + body.error.message);
//                 }
//             });
//         }
//     })
// })

// // Route for obtaining the access token and fetching user's profile
// app.get('/profile', function(req, res) {
//     getAccessToken(function(error, token) {
//         console.log("init the profile API")
//         if (error) {
//             console.log("error here?");
//             res.status(500).send(error);
//         } else {
//             console.log("token obtained, ", token);
//             const options = {
//                 url: 'https://api.spotify.com/v1/me',
//                 headers: {
//                     'Authorization': 'Bearer ' + token
//                 },
//                 json: true
//             };

//             request.get(options, function(error, response, body) {
//                 console.log("request made [response.statusCode]", response.statusCode);
//                 console.log("request made [error]", error);
//                 console.log("request made [body]", body);
//                 if (!body.error && response.statusCode === 200) {
//                     res.send(body);
//                 } else if (!body.error) {
//                     res.send(body);
//                 } else {
//                     console.log("error obtaining profile");
//                     console.log("error", error);
//                     console.log("body", body);
//                     res.status(response.statusCode).send('Error: ' + body.error.message);
//                 }
//             });
//         }
//     });
// });


// app.get('/view', function(req, res) {
//     // Retrieve user and info from session
//     const user = req.session.user;
//     const info = req.session.info;


//     console.log(user)
//     // console.log(info)

//     const userId = user.id

//     // Check if user and info exist in the session
//     if (!user || !info) {
//         return res.status(400).json({ error: 'User information not found in session' });
//     }

//     // Extract access token from user object
//     const accessToken = user.accessToken;

//     console.log("access token")

//     console.log(accessToken)
//     const options = {
//         url: `https://api.spotify.com/v1/users/${userId}/playlists`,
//         headers: {
//             'Authorization': 'Bearer ' + accessToken
//         },
//         json: true
//     };

//     request.get(options, function(error, response, body) {

//         if (error) {
//             return res.status(500).json({ error: 'Error making request to Spotify API' });
//         }

//         if (response.statusCode !== 200) {
//             return res.status(response.statusCode).json({ error: 'Failed to fetch user playlists from Spotify API' });
//         }

//         // Return the playlists fetched from the Spotify API
//         res.json(body);
//     });
// });

// app.get('/getPlaylistDetails/:playlistID', async (req, res) => {
//     try {
//         const playlistID = req.params.playlistID;
//         const accessToken = req.session.user.accessToken
//         const playlistDetails = await fetchPlaylistDetails(playlistID,accessToken);
//         console.log(playlistDetails)
//         res.render('playlistDetails', { playlistDetails });
//         // res.send(playlistDetails);
//     } catch (error) {
//         console.log("errorrrrrrrrrrr");
//         console.error('Error fetching playlist details:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

app.get('/getPlaylistDetails/:playlistID', async (req, res) => {
    try {
        // Extract playlistID from request parameters
        const playlistID = req.params.playlistID;
        console.log(playlistID);
        // Render HTML page and pass playlistID as data
        res.render('playlistDetailsHTML', { playlistID });
    } catch (error) {
        console.error('Error rendering playlist details page:', error);
        res.status(500).send('Internal Server Error');
    }
});


// app.get('/getPlaylistDetailsData/:playlistID', async (req, res) => {
//     try {
//         const playlistID = req.params.playlistID;
//         const accessToken = req.session.user.accessToken;
//         const playlistDetails = await fetchPlaylistDetails(playlistID, accessToken);
//         // res.render('playlistDetailsHTML', { playlistDetails });
//         console.log(playlistDetails);
//         res.send(playlistDetails)
//     } catch (error) {
//         console.error('Error fetching playlist details:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// async function fetchPlaylistDetails(playlistID,accessToken) {
//     console.log(playlistID);
//     const url = `https://api.spotify.com/v1/playlists/${playlistID}/`;
//     const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//             'Authorization': 'Bearer ' + accessToken
//         }
//     });
//     console.log("fetchingPlaylist Details");
//     const data = await response.json();
//     return data;
// }

app.get('/getPlaylistDetailsData/:playlistID', async (req, res) => {
    try {
        const playlistID = req.params.playlistID;
        const accessToken = req.session.user.accessToken;
        const page = req.query.page || 1; 
        const limit = 10; 
        const offset = (page - 1) * limit; 

        const playlistDetails = await fetchPlaylistDetails(playlistID, accessToken, limit, offset);
        console.log("pageno",page);
        console.log(playlistDetails);
        res.send(playlistDetails);
    } catch (error) {
        console.error('Error fetching playlist details:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function fetchPlaylistDetails(playlistID, accessToken, limit, offset) {
    const url = `https://api.spotify.com/v1/playlists/${playlistID}/tracks?limit=${limit}&offset=${offset}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });
    const data = await response.json();
    return data;
}


app.get('/view', async (req, res) => {
    try {
        const page = req.query.page || 1;

        const playlists = await fetchPlaylists(page, req.session.user, req.session.info);
        
        res.json(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ error: 'Error fetching playlists' });
    }
});

app.listen(3000, function () {
    // getAccessToken((err, token) => {
    //     console.log(`got access token at server start <${token}>`);
    // })
    console.log('Server is running on port 3000');
});
