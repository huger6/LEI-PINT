import { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { uploadProfileImageToTemp } from '../../services/storage';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import BadgeEditor from '../BadgeEditor/BadgeEditor';
import ConfirmToast from '../ConfirmToast/ConfirmToast';
import styles from './BadgeImagePicker.module.css';

// Badge artwork is vector-only: the in-app designer exports SVG and uploads
// must match, so the field accepts SVG exclusively.
const ACCEPT = 'image/svg+xml,.svg';

// Returns true if the given file is an SVG by MIME type or extension.
const isSvg = (file) => file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');

/**
 * Badge image selector allowing upload or selection from the badge editor canvas.
 * @param {string} [value] - Current image URL.
 * @param {Function} onChange - Called with the new image URL.
 */
export default function BadgeImagePicker({ value, onChange, onUploadingChange, disabled = false, label }) {
	const { t } = useTranslation();
	// Ref to the hidden file input for triggering the OS file picker.
	const fileInputRef = useRef(null);
	// Tracks whether an upload is currently in progress.
	const [uploading, setUploading] = useState(false);
	// Holds the current upload or validation error message.
	const [error, setError] = useState('');
	// Controls whether the in-app badge designer modal is open.
	const [showDesigner, setShowDesigner] = useState(false);
	// Controls the exit confirmation prompt when closing the designer.
	const [showExitConfirm, setShowExitConfirm] = useState(false);

	// Sets the uploading state and notifies the parent via onUploadingChange.
	const setBusy = useCallback((busy) => {
		setUploading(busy);
		onUploadingChange?.(busy);
	}, [onUploadingChange]);

	// Uploads the given SVG file to temporary storage and calls onChange with the URL.
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

	// Validates that the selected file is an SVG before uploading it.
	const onFileChange = useCallback((event) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		if (!isSvg(file)) {
			setError(t('badgeImage.svgOnly', { defaultValue: 'A imagem do badge tem de estar em formato SVG.' }));
			return;
		}
		upload(file);
	}, [upload, t]);

	// Converts the exported SVG string to a File object and uploads it.
	const onDesignerExport = useCallback((svg) => {
		setShowDesigner(false);
		const file = new File([svg], `badge_${Date.now()}.svg`, { type: 'image/svg+xml' });
		upload(file);
	}, [upload]);

	// Clears the current image URL and any error state.
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
					size="xl"
					onClose={() => setShowExitConfirm(true)}
				>
					<BadgeEditor
						onExport={onDesignerExport}
						exportLabel={t('badgeImage.useDesign', { defaultValue: 'Usar este desenho' })}
					/>
					<ConfirmToast
						open={showExitConfirm}
						message={t('badgeImage.exitConfirm', { defaultValue: 'Deseja sair? Todas as alterações serão perdidas.' })}
						confirmLabel={t('confirmToast.yes', { defaultValue: 'Yes' })}
						cancelLabel={t('confirmToast.no', { defaultValue: 'No' })}
						onConfirm={() => { setShowExitConfirm(false); setShowDesigner(false); }}
						onCancel={() => setShowExitConfirm(false)}
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
