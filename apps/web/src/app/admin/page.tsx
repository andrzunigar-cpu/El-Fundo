import { redirect } from 'next/navigation'

// El acceso al admin se hace por la ruta privada
export default function AdminRedirect() {
  redirect('/')
}
