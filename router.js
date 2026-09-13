import express                    from 'express';
import signInRouter               from "#auth/sign-in/sign-in.router.js";
import signUpRouter               from "#auth/sign-up/sign-up.router.js";
import playlistsRouter            from "#playlists/get-my-playlists/get-my-playlists.router.js";
import validateUserSessionRouter  from '#auth/validate-session/validate-session.router.js';
import getUserRouter              from '#songs/get-all-songs/get-all-songs.router.js'
import addViewRouter              from '#songs/add-song-view/add-song-view.router.js';
import getAuthorsAlbumsRouter     from '#albums/get-author-albums/get-author-albums.router.js';
import saveSongInBaseRouter       from '#songs/publish-song/publish-song.router.js';
import createPlaylistRouter       from '#playlists/create-playlist/create-playlist.router.js';
import getPlaylistsRouter         from '#playlists/get-playlist/get-playlist.router.js';
import getSongRouter              from '#songs/get-song-by-id/get-song-by-id.router.js';
import addSongToPlaylistRouter    from '#playlists/add-song-to-playlist/add-song-to-playlist.router.js';
import handleRemoveSongRouter     from '#playlists/remove-song-from-playlist/remove-song-from-playlist.router.js';
import mySongsRouter              from '#songs/my-songs/my-songs.router.js';

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

