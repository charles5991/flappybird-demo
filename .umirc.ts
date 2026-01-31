import { defineConfig } from 'umi/dist/defineConfig';

export default defineConfig({
    routes: [
        {
            path: '/',
            component: './index',
        },
        {
            path: '/game/setting',
            component: './game/setting',
        },
    ],
    npmClient: 'pnpm',
    plugins: [
        '@umijs/plugins/dist/antd',
    ],
    antd: {},
});
