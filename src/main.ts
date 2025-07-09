import { createApp } from 'vue'
import Demo from './Demo.vue'
import { createPinia } from 'pinia'

import './assets/styles.css'

const app = createApp(Demo)
const pinia = createPinia()
app.use(pinia)

app.mount('#app')
