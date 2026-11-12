import { STORE } from './store'

// Categories must match the ones used in the admin product form.
export const CATEGORIES = ['Feed & Supplements', 'Feeders & Drinkers', 'Incubators', 'Heating & Brooding', 'Eggs & Chicks']


export const money = (n) => `${STORE.currency} ${Math.round(n).toLocaleString('en-US')}`
