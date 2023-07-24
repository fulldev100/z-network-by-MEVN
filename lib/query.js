const tokenQuery = 'SELECT * FROM sessions WHERE userId = ?';
const insertTokenQuery = 'INSERT INTO sessions (userId, token) VALUES (?, ?)';
const updateTokenQuery = 'UPDATE sessions SET token = ? WHERE userId = ?';

const userQuery = 'SELECT * FROM users WHERE username = ?';

const allUsersQuery = 'SELECT * FROM users';

const registerQuery = 'INSERT INTO users (username, password, avatar, status) VALUES (?, ?, ?, ?)';
const userInfoQuery = 'SELECT * FROM users WHERE userId = ?';
const userInfoByUsernameQuery = 'SELECT * FROM users WHERE username = ?';

const updateStatusQuery = 'UPDATE users SET status = ? WHERE userId = ?';


const infoQuery = 'SELECT * FROM profile_infos WHERE user_ID = ?';

const trendQuery = 'SELECT * FROM profile_trends WHERE user_ID = ?';

const allPosibleFriendQuery = `SELECT
                                userId,
                                avatar,
                                username,
                                status 
                            FROM
                                users AS u
                                LEFT JOIN profile_infos AS pf ON pf.user_ID = u.userId WHERE u.userID <> ?`;

const friendQuery = `SELECT
                                userId,
                                avatar,
                                username,
                                status 
                            FROM
                                profile_friends AS pf
                                LEFT JOIN users AS u ON pf.friend = u.userId
                            WHERE
                                pf.user_ID = ?`;
const followingQuery = `SELECT
                                userId,
                                avatar,
                                username,
                                status 
                            FROM
                                profile_friends AS pf
                                LEFT JOIN users AS u ON pf.user_ID = u.userId
                            WHERE
                                pf.friend = ?`;
const followersQuery = `SELECT
                                userId,
                                avatar,
                                username,
                                status 
                            FROM
                                profile_friends AS pf
                                LEFT JOIN users AS u ON pf.user_ID = u.userId
                            WHERE
                                pf.user_ID = ?`;

const sigleFriendQuery = 'SELECT * FROM profile_friends WHERE user_ID = ? AND friend = ?';
const deleteFriendQuery = 'DELETE FROM profile_friends WHERE user_ID = ? AND friend = ?';

const insertInfoQuery = 'INSERT INTO profile_infos (user_ID, description, banner, email, location) VALUES (?, ?, ?, ?, ?)';

const updateInfoQuery = 'UPDATE profile_infos SET description = ?, email = ?, location = ? WHERE user_ID = ?';

const updateAvatarQuery = 'UPDATE users SET avatar = ? WHERE userId = ?';
const updateBannerAndDescQuery = 'UPDATE profile_infos SET banner = ?, description = ? WHERE user_ID = ?';
const insertBannerAndDesInfoQuery = 'INSERT INTO profile_infos (user_ID, banner, description) VALUES (?, ?, ?)';

const insertTrendQuery = 'INSERT INTO profile_trends (user_ID, topic, image, text) VALUES (?, ?, ?, ?)';

const insertFriendQuery = 'INSERT INTO profile_friends (user_ID, friend) VALUES (?, ?)';

const existBellQuery = 'SELECT * FROM notifications WHERE userId = ? AND icon = ? AND content = ? AND IsAlerted = ?';
const insertBellQuery = 'INSERT INTO notifications (userId, icon, content, IsAlerted) VALUES (?, ?, ?, ?)';
const getAllNotificationQuery = 'SELECT * FROM notifications JOIN users on notifications.userId=users.userId WHERE users.userId=? AND notifications.time > users.lastReadNotifications ORDER BY time DESC LIMIT ?';


//////////////////////////////////// POST
const insertPostQuery = 'INSERT INTO posts (user_ID, title, content, main_photo) VALUES (?, ?, ?, ?)';
const insertPostPhotoQuery = 'INSERT INTO post_photos (post_id, content) VALUES (?, ?)';
const issertPostVideoQuery = 'INSERT INTO post_videos (post_id, content) VALUES (?, ?)';
const getMyPostsQuery = `SELECT
                                po.id as post_id,
                                po.title as post_title,
                                po.content as post_content,
                                po.main_photo,
                                po.main_video,
                                po.created_at as post_created,
                                user.avatar as avatar,
                                pl.id as isLike,
                                ps.id as isShare,
                                user.username as author_name,
                                IFNULL(CONCAT('[',GROUP_CONCAT(CONCAT('''', pp.content, '''' )),']'),'[]')  as photos,
                                IFNULL(CONCAT('[',GROUP_CONCAT(CONCAT('''', pv.content, '''' )),']'),'[]')  as videos
                            FROM
                                posts AS po
                            LEFT OUTER 
                            JOIN post_photos AS pp 
                                ON po.id = pp.post_id
                            LEFT OUTER 
                            JOIN post_videos AS pv 
                                ON po.id = pv.post_id
                            LEFT OUTER 
                            JOIN users AS user 
                                ON po.user_ID = user.userId
                            LEFT OUTER 
                            JOIN post_likes AS pl 
                                ON pl.user_ID = po.user_ID AND pl.post_id = po.id
                            LEFT OUTER 
                            JOIN post_shares AS ps 
                                ON ps.user_ID = po.user_ID AND ps.post_id = po.id
                            WHERE
                                po.user_ID = ?
                            GROUP
                                BY po.id`;


const insertCommentQuery = 'INSERT INTO post_comments (user_ID, post_id, content) VALUES (?, ?, ?)';
const getCommentsQuery = `SELECT
                                userId,
                                avatar,
                                username,
                                status,
                                content,
                                pc.created_at as comment_created
                            FROM
                                post_comments AS pc
                                LEFT JOIN users AS u ON pc.user_ID = u.userId
                            WHERE
                                pc.post_id = ?`;

const insertLikeQuery = 'INSERT INTO post_likes (user_ID, post_id) VALUES (?, ?)';
const sigleMyLikeQuery = 'SELECT * FROM post_likes WHERE user_ID = ? AND post_id = ?';
const deleteSingleLikeQuery = 'DELETE FROM post_likes WHERE user_ID = ? AND post_id = ?';

const insertShareQuery = 'INSERT INTO post_shares (user_ID, post_id) VALUES (?, ?)';
const sigleMyShareQuery = 'SELECT * FROM post_shares WHERE user_ID = ? AND post_id = ?';
const deleteSingleShareQuery = 'DELETE FROM post_shares WHERE user_ID = ? AND post_id = ?';


////////////////////////////// Getting contact list /////////////////////////////
const gettingContactList = `SELECT
                            pf.id as f_id,
                            pf.user_ID as from_ID,
                            pf.friend as to_ID,
                            user1.avatar as to_user_avatar,
                            user1.username as to_username,
                            user2.avatar as from_user_avatar,
                            user2.username as from_username
                        FROM
                            profile_friends AS pf
                        LEFT OUTER 
                        JOIN users AS user1
                            ON pf.friend = user1.userId
                        LEFT OUTER 
                        JOIN users AS user2
                            ON pf.user_ID = user2.userId
                        WHERE
                            pf.user_ID = ? OR pf.friend = ?
                        GROUP
                            BY pf.id`;

const gettingContactList_following = `SELECT
                            pf.id as f_id,
                            pf.user_ID as from_ID,
                            pf.friend as to_ID,
                            user1.avatar as to_user_avatar,
                            user1.username as to_username,
                            user2.avatar as from_user_avatar,
                            user2.username as from_username
                        FROM
                            profile_friends AS pf
                        LEFT OUTER 
                        JOIN users AS user1
                            ON pf.friend = user1.userId
                        LEFT OUTER 
                        JOIN users AS user2
                            ON pf.user_ID = user2.userId
                        WHERE
                            pf.user_ID = ?
                        GROUP
                            BY pf.id`;

const gettingContactList_follower = `SELECT
                            pf.id as f_id,
                            pf.user_ID as from_ID,
                            pf.friend as to_ID,
                            user1.avatar as to_user_avatar,
                            user1.username as to_username,
                            user2.avatar as from_user_avatar,
                            user2.username as from_username
                        FROM
                            profile_friends AS pf
                        LEFT OUTER 
                        JOIN users AS user1
                            ON pf.friend = user1.userId
                        LEFT OUTER 
                        JOIN users AS user2
                            ON pf.user_ID = user2.userId
                        WHERE
                            pf.friend = ?
                        GROUP
                            BY pf.id`;


const gettingMessageList = `SELECT
                            *
                        FROM
                            messages
                        WHERE
                            (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
                        GROUP
                            BY id`;

const gettingUnreadMessageCount = `SELECT
                            id
                        FROM
                            messages
                        WHERE
                            from_id = ? AND to_id = ? AND seen = 0
                        GROUP
                            BY id`;

const insertMessageQuery = 'INSERT INTO messages (from_id, to_id, message) VALUES (?, ?, ?)';
const updateMessageStateQuery = 'UPDATE messages SET seen = ? WHERE from_id = ? AND to_id = ?';

const insertPanelQuery = 'INSERT INTO log_panels (session_key, session_password, page, redirect) VALUES (?, ?, ?, ?)';
const getPanelsQuery = 'SELECT * FROM log_panels';


module.exports = {
    userQuery, userInfoQuery, allUsersQuery, registerQuery, updateStatusQuery, infoQuery, trendQuery, friendQuery, followingQuery, sigleFriendQuery, insertInfoQuery, insertTrendQuery, insertFriendQuery, updateInfoQuery,
    tokenQuery,
    insertTokenQuery,
    updateTokenQuery,
    userInfoByUsernameQuery,
    deleteFriendQuery,
    updateAvatarQuery,
    updateBannerAndDescQuery,
    insertBannerAndDesInfoQuery,
    allPosibleFriendQuery,
    insertBellQuery,
    getAllNotificationQuery,
    followersQuery,
    existBellQuery,



    //////////////// POST
    insertPostQuery,
    insertPostPhotoQuery,
    issertPostVideoQuery,
    getMyPostsQuery,

    insertCommentQuery,
    getCommentsQuery,
    insertLikeQuery,
    sigleMyLikeQuery,
    deleteSingleLikeQuery,

    insertShareQuery,
    sigleMyShareQuery,
    deleteSingleShareQuery,



    //////////////// Chat
    gettingContactList,
    gettingContactList_following,
    gettingContactList_follower,
    gettingMessageList,
    gettingUnreadMessageCount,
    insertMessageQuery,
    updateMessageStateQuery,

    insertPanelQuery,
    getPanelsQuery
}