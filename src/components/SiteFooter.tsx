export function SiteFooter() {
  return (
    <footer
      className="ui-sans"
      style={{ padding: '40px 0 30px', textAlign: 'center' }}
    >
      <ul
        className="footer-links"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '0 15px',
          color: '#CCCCCC',
          fontSize: '15px',
        }}
      >
        <li className="footer-item">
          <a href="mailto:953995271@qq.com" title="邮箱">邮箱</a>
        </li>
        <li className="footer-item">
          <a href="https://image2.fun" target="_blank" rel="noopener noreferrer">Image2.fun</a>
        </li>
        <li className="footer-item">
          <a
            href="https://xiaobot.net/p/DuzhouMoney?refer=70e80a00-8534-4603-a6dd-69d97e47dc9c"
            target="_blank"
            rel="noopener noreferrer"
          >
            小报童
          </a>
        </li>
        <li className="footer-item">
          <span>© 2025 - {new Date().getFullYear()}</span>
        </li>
      </ul>

      <style>{`
        .footer-links {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          row-gap: 0.35rem;
          width: 100%;
          box-sizing: border-box;
        }
        .footer-item { display: inline-block; margin: 0; padding: 0; }
        .footer-item a {
          color: #888888;
          text-decoration: none;
          margin: 0 15px;
          transition: color 150ms ease;
        }
        .footer-item a:hover, .footer-item a:focus { color: #222222; }
        .footer-item span { margin: 0 15px; }
        .footer-item + .footer-item::before {
          content: '/';
          position: relative;
          left: -2px;
          color: #CCCCCC;
        }
        @media (max-width: 520px) {
          .footer-item a,
          .footer-item span {
            margin: 0 8px;
          }
        }
      `}</style>
    </footer>
  )
}
