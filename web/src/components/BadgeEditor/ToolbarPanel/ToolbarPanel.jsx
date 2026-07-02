import { useRef } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../../Tooltip/Tooltip';
import { BADGE_TEMPLATES } from '../templates.jsx';
import styles from './ToolbarPanel.module.css';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

// Badge editor toolbar with shape, text, image, action, and template controls.
export default function ToolbarPanel({
	onAddShape, onAddText, onBringFront, onSendBack, onDelete, onClear,
	onDuplicate, onUndo, onRedo, onImportImage, onSelectTemplate,
	canUndo, canRedo, hasSelection, t,
}) {
	// Ref to the hidden file input used to trigger the OS file picker.
	const fileRef = useRef(null);

	// Validates the selected image file size then passes it to the import handler.
	const handleImageFile = (e) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		if (file.size > MAX_IMAGE_SIZE) {
			alert(t('badgeEditor.imageTooLarge'));
			return;
		}
		onImportImage(file);
	};

	return (
		<div className={styles.toolbar}>
			{/* Shapes */}
			<div className={styles.panel}>
				<p className={styles.panelTitle}>{t('badgeEditor.shapes')}</p>
				<div className={styles.shapeGrid}>
					<button type="button" className={styles.shapeBtn} onClick={() => onAddShape('circle')}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<circle cx="12" cy="12" r="9" />
						</svg>
						{t('badgeEditor.circle')}
					</button>
					<button type="button" className={styles.shapeBtn} onClick={() => onAddShape('hexagon')}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
						</svg>
						{t('badgeEditor.hexagon')}
					</button>
					<button type="button" className={styles.shapeBtn} onClick={() => onAddShape('shield')}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 5l9-3 9 3v6c0 5.25-3.75 9.75-9 11.25C6.75 20.75 3 16.25 3 11V5z" />
						</svg>
						{t('badgeEditor.shield')}
					</button>
					<button type="button" className={styles.shapeBtn} onClick={() => onAddShape('rect')}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<rect x="3" y="3" width="18" height="18" rx="3" />
						</svg>
						{t('badgeEditor.rectangle')}
					</button>
				</div>
			</div>

			{/* Text */}
			<div className={styles.panel}>
				<p className={styles.panelTitle}>{t('badgeEditor.text')}</p>
				<button type="button" className={styles.textBtn} onClick={onAddText}>
					<i className="bi bi-fonts" /> {t('badgeEditor.addText')}
				</button>
			</div>

			{/* Image import */}
			<div className={styles.panel}>
				<p className={styles.panelTitle}>{t('badgeEditor.importImage')}</p>
				<button type="button" className={styles.textBtn} onClick={() => fileRef.current?.click()}>
					<i className="bi bi-image" /> {t('badgeEditor.importImage')}
				</button>
				<input
					ref={fileRef}
					type="file"
					accept="image/*"
					className="d-none"
					onChange={handleImageFile}
				/>
			</div>

			{/* Actions */}
			<div className={styles.panel}>
				<p className={styles.panelTitle}>{t('badgeEditor.actions')}</p>
				<div className={styles.actionRow}>
					<Tooltip text={t('badgeEditor.undo')}>
						<button type="button" className={styles.actionBtn} onClick={onUndo} disabled={!canUndo}>
							<i className="bi bi-arrow-counterclockwise" />
						</button>
					</Tooltip>
					<Tooltip text={t('badgeEditor.redo')}>
						<button type="button" className={styles.actionBtn} onClick={onRedo} disabled={!canRedo}>
							<i className="bi bi-arrow-clockwise" />
						</button>
					</Tooltip>
					<Tooltip text={t('badgeEditor.duplicate')}>
						<button type="button" className={styles.actionBtn} onClick={onDuplicate} disabled={!hasSelection}>
							<i className="bi bi-copy" />
						</button>
					</Tooltip>
				</div>
				<div className={styles.actionRow}>
					<Tooltip text={t('badgeEditor.bringFront')}>
						<button type="button" className={styles.actionBtn} onClick={onBringFront} disabled={!hasSelection}>
							<i className="bi bi-front" /> {t('badgeEditor.bringFront')}
						</button>
					</Tooltip>
					<Tooltip text={t('badgeEditor.sendBack')}>
						<button type="button" className={styles.actionBtn} onClick={onSendBack} disabled={!hasSelection}>
							<i className="bi bi-back" /> {t('badgeEditor.sendBack')}
						</button>
					</Tooltip>
				</div>
				<div className={styles.actionRow}>
					<button type="button" className={styles.dangerBtn} onClick={onDelete} disabled={!hasSelection}>
						<i className="bi bi-trash" /> {t('badgeEditor.delete')}
					</button>
					<button type="button" className={styles.dangerBtn} onClick={onClear}>
						<i className="bi bi-x-circle" /> {t('badgeEditor.clear')}
					</button>
				</div>
			</div>

			{/* Templates */}
			<div className={styles.panel}>
				<p className={styles.panelTitle}>{t('badgeEditor.templates')}</p>
				<div className={styles.templateGrid}>
					{BADGE_TEMPLATES.map((tpl) => (
						<button
							type="button"
							key={tpl.id}
							className={styles.templateBtn}
							onClick={() => onSelectTemplate(tpl.id)}
							title={t(tpl.nameKey)}
						>
							{tpl.icon}
							<span>{t(tpl.nameKey)}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

ToolbarPanel.propTypes = {
	onAddShape: PropTypes.func.isRequired,
	onAddText: PropTypes.func.isRequired,
	onBringFront: PropTypes.func.isRequired,
	onSendBack: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	onClear: PropTypes.func.isRequired,
	onDuplicate: PropTypes.func.isRequired,
	onUndo: PropTypes.func.isRequired,
	onRedo: PropTypes.func.isRequired,
	onImportImage: PropTypes.func.isRequired,
	onSelectTemplate: PropTypes.func.isRequired,
	canUndo: PropTypes.bool.isRequired,
	canRedo: PropTypes.bool.isRequired,
	hasSelection: PropTypes.bool.isRequired,
	t: PropTypes.func.isRequired,
};
