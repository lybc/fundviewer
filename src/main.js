import Vue from 'vue'
import App from './App.vue'
import Router from 'vue-router'
import routes from './router/routers'
import axios from 'axios'
import './plugins/iview.js'

Vue.config.productionTip = false
Vue.prototype.$http = axios;

Vue.use(Router)

const router = new Router({
  routes,
  mode: 'history'
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `基王争霸 | ${to.meta.title}`
  }
  next()
})

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
