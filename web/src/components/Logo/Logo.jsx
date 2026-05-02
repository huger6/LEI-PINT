import styles from './Logo.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

export default function Logo() {
  return (
    <div className={styles.wrapper}>
      <img src={LOGO_SRC} alt="Softinsa Badges Platform" className={styles.logo} />
    </div>
  );
}
