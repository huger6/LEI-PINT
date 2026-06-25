import { useTranslation } from 'react-i18next';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

/** Softinsa platform logo component used in the sidebar and top bar. */
// Renders the Softinsa logo image with accessible alt text.
export default function Logo() {
	// Provides translated alt text for the logo image.
	const { t } = useTranslation();
	return (
		<div className="d-flex justify-content-center">
			<img
				src={LOGO_SRC}
				alt={t('logoAlt')}
				style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
			/>
		</div>
	);
}
