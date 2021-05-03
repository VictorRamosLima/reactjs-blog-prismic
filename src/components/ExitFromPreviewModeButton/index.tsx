import Link from 'next/link'

import styles from './button.module.scss'

export const ExitFromPreviewModeButton = () => (
  <button type="button" className={styles.previewModeButton}>
    <Link href="/api/exit-preview">Sair do modo Preview</Link>
  </button>
)
