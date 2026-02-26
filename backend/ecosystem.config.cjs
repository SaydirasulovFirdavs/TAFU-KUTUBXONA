module.exports = {
    apps: [
        {
            name: 'web-kutubxona-backend',
            script: 'server.js',
            node_args: '--loader ts-node/register', // Just in case, keeping standard
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            }
        },
        {
            name: 'image-sync',
            script: 'sync_images.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: false,
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
