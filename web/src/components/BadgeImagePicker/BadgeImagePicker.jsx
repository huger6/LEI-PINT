import { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { uploadProfileImageToTemp } from '../../services/storage';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import BadgeEditor from '../BadgeEditor/BadgeEditor';
import styles from './BadgeImagePicker.module.css';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif';

/**
 * Reusable image field for badges / requirements: live preview, file upload
 * (via the existing temp-storage flow), and an in-app SVG designer (BadgeEditor).
 * The chosen image is uploaded to /temp and the public URL is handed back via
 * onChange; the API moves it to permanent storage on save.
 */
export default function BadgeImagePicker({ value, onChange, onUploadingChange, disabled = false, label }) {
	const { t } = useTranslation();
	const fileInputRef = useRef(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [showDesigner, setShowDesigner] = useState(false);

	const setBusy = useCallback((busy) => {
		setUploading(busy);
		onUploadingChange?.(busy);
	}, [onUploadingChange]);

	const upload = useCallback(async (file) => {
		setError('');
		setBusy(true);
		try {
			const { publicUrl } = await uploadProfileImageToTemp(file);
			onChange(publicUrl);
		} catch (err) {
			setError(t('badgeImage.uploadFailed', { defaultValue: 'Falha ao carregar a imagem.' }));
			console.error(err);
		} finally {
			setBusy(false);
		}
	}, [onChange, setBusy, t]);

	const onFileChange = useCallback((event) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (file) upload(file);
	}, [upload]);

	const onDesignerExport = useCallback((svg) => {
		setShowDesigner(false);
		const file = new File([svg], `badge_${Date.now()}.svg`, { type: 'image/svg+xml' });
		upload(file);
	}, [upload]);

	const clear = useCallback(() => {
		setError('');
		onChange('');
	}, [onChange]);

	return (
		<div>
			{label && <label className="form-label">{label}</label>}
			<div className={styles.picker}>
				<div className={styles.preview}>
					{uploading ? (
						<span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
					) : value ? (
						<img src={value} alt={t('badgeImage.previewAlt', { defaultValue: 'Pré-visualização do badge' })} />
					) : (
						<i className={`bi bi-image ${styles.placeholderIcon}`} aria-hidden="true" />
					)}
				</div>

				<div className={styles.actions}>
					<Button
						type="button"
						variant="outlined"
						size="sm"
						disabled={disabled || uploading}
						onClick={() => fileInputRef.current?.click()}
					>
						<i className="bi bi-upload me-1" aria-hidden="true" />
						{t('badgeImage.upload', { defaultValue: 'Carregar' })}
					</Button>
					<Button
						type="button"
						variant="outlined"
						size="sm"
						disabled={disabled || uploading}
						onClick={() => setShowDesigner(true)}
					>
						<i className="bi bi-pencil-square me-1" aria-hidden="true" />
						{t('badgeImage.design', { defaultValue: 'Desenhar' })}
					</Button>
					{value && (
						<Button
							type="button"
							variant="outlined"
							color="danger"
							size="sm"
							disabled={disabled || uploading}
							onClick={clear}
						>
							<i className="bi bi-trash me-1" aria-hidden="true" />
							{t('shared.remove', { defaultValue: 'Remover' })}
						</Button>
					)}
				</div>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept={ACCEPT}
				className="d-none"
				onChange={onFileChange}
			/>

			{error && <p className={`small mt-2 ${styles.error}`}>{error}</p>}

			{showDesigner && (
				<Modal
					title={t('badgeImage.designerTitle', { defaultValue: 'Desenhar badge' })}
					size="lg"
					onClose={() => setShowDesigner(false)}
				>
					<BadgeEditor
						onExport={onDesignerExport}
						exportLabel={t('badgeImage.useDesign', { defaultValue: 'Usar este desenho' })}
					/>
				</Modal>
			)}
		</div>
	);
}

BadgeImagePicker.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	onUploadingChange: PropTypes.func,
	disabled: PropTypes.bool,
	label: PropTypes.string,
};
