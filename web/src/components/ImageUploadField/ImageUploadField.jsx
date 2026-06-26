import { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { uploadProfileImageToTemp } from '../../services/storage';
import Button from '../Button/Button';
import styles from './ImageUploadField.module.css';

// Accepts the common raster image formats (rewards use promotional artwork, not
// the vector-only badge artwork handled by BadgeImagePicker).
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

/**
 * Generic image upload field with preview. Uploads the chosen file to temporary
 * storage and reports the resulting URL via onChange — the caller persists it
 * (the server promotes temp URLs to permanent on save).
 * @param {string} [value] - Current image URL.
 * @param {Function} onChange - Called with the new image URL ('' when cleared).
 */
export default function ImageUploadField({ value, onChange, onUploadingChange, disabled = false, label }) {
	const { t } = useTranslation();
	// Ref to the hidden file input for triggering the OS file picker.
	const fileInputRef = useRef(null);
	// Tracks whether an upload is currently in progress.
	const [uploading, setUploading] = useState(false);
	// Holds the current upload or validation error message.
	const [error, setError] = useState('');

	// Sets the uploading state and notifies the parent (e.g. to disable Save).
	const setBusy = useCallback((busy) => {
		setUploading(busy);
		onUploadingChange?.(busy);
	}, [onUploadingChange]);

	// Uploads the selected file to temporary storage and reports its URL.
	const onFileChange = useCallback(async (event) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		setError('');
		setBusy(true);
		try {
			const { publicUrl } = await uploadProfileImageToTemp(file);
			onChange(publicUrl);
		} catch (err) {
			setError(t('imageUpload.failed', { defaultValue: 'Falha ao carregar a imagem.' }));
			console.error(err);
		} finally {
			setBusy(false);
		}
	}, [onChange, setBusy, t]);

	return (
		<div>
			{label && <label className="form-label">{label}</label>}
			<div className={styles.picker}>
				<div className={styles.preview}>
					{uploading ? (
						<span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
					) : value ? (
						<img src={value} alt={t('imageUpload.previewAlt', { defaultValue: 'Pré-visualização' })} />
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
						{t('imageUpload.upload', { defaultValue: 'Carregar imagem' })}
					</Button>
					{value && (
						<Button
							type="button"
							variant="outlined"
							color="danger"
							size="sm"
							disabled={disabled || uploading}
							onClick={() => { setError(''); onChange(''); }}
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
		</div>
	);
}

ImageUploadField.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	onUploadingChange: PropTypes.func,
	disabled: PropTypes.bool,
	label: PropTypes.string,
};
