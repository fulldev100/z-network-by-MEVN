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
                                profile_infos AS pf
                                LEFT JOIN users AS u ON pf.user_ID = u.userId WHERE u.userID <> ?`;

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


const insertBellQuery = 'INSERT INTO notifications (userId, icon, content, IsAlerted) VALUES (?, ?, ?, ?)';
const getAllNotificationQuery = 'SELECT * FROM notifications WHERE userId = ?';


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
                            WHERE
                                po.user_ID = ?
                            GROUP
                                BY po.id`;
                                

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



    //////////////// POST
    insertPostQuery,
    insertPostPhotoQuery,
    issertPostVideoQuery,
    getMyPostsQuery
}