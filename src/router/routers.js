export default [
    {
        path: "/",
        name: "index",
        component: () => import("../view/index/index.vue"),
        meta: {
            title: "首页"
        }
    }
]