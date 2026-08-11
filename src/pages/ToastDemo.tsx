import ToastFeed from '../components/ToastFeed'
import type { ToastItem } from '../components/NotificationToast'

const items: ToastItem[] = [
  {
    assetSrc: '/about/photo.jpg',
    copy: "One of my favourite things about my new portfolio is the 20+ years of design snippets in my Archives page.",
    label: '@ericsin • threads',
    href: 'https://www.threads.com/@imericsin',
  },
  {
    assetSrc: '',
    title: 'ToastFeed Component Added',
    copy: 'A simple component to share latest news.',
    label: 'Site Updates',
    href: '/',
  },
  {
    assetSrc: '/about/photo.jpg',
    copy: '"Don\'t be so scared to ask for help, everyone needs it, and you definitely should!"',
    label: 'Post on LinkedIn',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7493041079777157120/',
  },
]

// Dev-only sandbox route for the toast/cycle-controller/icon-button set —
// not linked from any nav, remove once the component is placed for real.
export default function ToastDemo() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f2' }}>
      <ToastFeed items={items} />
    </div>
  )
}
