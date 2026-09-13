import express                    from 'express';
import signInRouter               from "./modules/postModules/signInModule/signIn.router.js";
import signUpRouter               from "./modules/postModules/signUpModule/signUp.router.js";
import playlistsRouter            from "./modules/postModules/getPlaylistsModule/getPlaylist.router.js";
import validateUserSessionRouter  from './modules/postModules/validateUserSessionModule/validateUserSession.router.js';
import getUserRouter              from './modules/getModules/getSongsModule/getSongs.router.js'
import addViewRouter              from './modules/postModules/addViewModule/addVIew.router.js';
import getAuthorsAlbumsRouter     from './modules/getModules/getAuthorsAlbumsModule/getAuthorsAlbums.router.js';
import saveSongInBaseRouter       from './modules/postModules/saveSongInBaseModule/saveSongInBase.router.js';
import createPlaylistRouter       from './modules/postModules/createPlaylistModule/createPlaylist.router.js';   
import getPlaylistsRouter         from './modules/getModules/getPlaylistsModule/getPlaylist.router.js'; 
import getSongRouter              from './modules/getModules/getSongModule/getSong.router.js';
import addSongToPlaylistRouter    from './modules/postModules/addSongIntoPlaylistModule/addSongIntoPlaylist.router.js';
import handleRemoveSongRouter     from './modules/postModules/handleRemoveSongModule/handleRemoveSong.router.js';
import mySongsRouter              from './modules/postModules/mySongsModule/mySongs.router.js';

const router = express.Router();



router.use(signInRouter                 );
router.use(signUpRouter                 );
router.use(playlistsRouter              );
router.use(validateUserSessionRouter    );
router.use(getUserRouter                );
router.use(addViewRouter                );
router.use(getAuthorsAlbumsRouter       );
router.use(saveSongInBaseRouter         );
router.use(createPlaylistRouter         );
router.use(getPlaylistsRouter           );
router.use(getSongRouter                );
router.use(addSongToPlaylistRouter      );
router.use(handleRemoveSongRouter       );
router.use(mySongsRouter                );




export default router;
