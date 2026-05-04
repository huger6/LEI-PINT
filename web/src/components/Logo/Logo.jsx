import { useTranslation } from 'react-i18next';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

export default function Logo() {
	const { t } = useTranslation();
	return (
		<div className="d-flex justify-content-center mb-1">
			<img
				src={LOGO_SRC}
				alt={t('logoAlt')}
				style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
			/>
		</div>
	);
}
