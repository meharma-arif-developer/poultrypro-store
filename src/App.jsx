import { Routes, Route } from 'react-router-dom'
import Store from './pages/Store'
import MyOrders from './pages/MyOrders'
import AdminApp from './pages/admin/AdminApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Store />} />
      <Route path="/orders" element={<MyOrders />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Store />} />
    </Routes>
  )
}
