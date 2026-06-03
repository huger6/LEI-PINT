import { useRef, useState } from 'react';
import Icon from '../Icons/Icons';
import styles from './FileDropZone.module.css';

function formatFileSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropZone({
	files = [],
	onAdd,
	onRemove,
	maxSizeLabel = '500MB',
	dropLabel,
	fileCountLabel,
}) {
	const inputRef = useRef(null);
	const [dragOver, setDragOver] = useState(false);

	function handleDrop(e) {
		e.preventDefault();
		setDragOver(false);
		if (onAdd) {
			Array.from(e.dataTransfer.files).forEach((f) => onAdd(f));
		}
	}

	function handleDragOver(e) {
		e.preventDefault();
		setDragOver(true);
	}

	function handleDragLeave() {
		setDragOver(false);
	}

	function handleClick() {
		inputRef.current?.click();
	}

	function handleFileSelect(e) {
		if (onAdd) {
			Array.from(e.target.files).forEach((f) => onAdd(f));
		}
		e.target.value = '';
	}

	return (
		<div className={styles.wrapper}>
			<div
				className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={handleClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => e.key === 'Enter' && handleClick()}
			>
				<input
					ref={inputRef}
					type="file"
					multiple
					className={styles.hiddenInput}
					onChange={handleFileSelect}
				/>
				<div className={styles.iconCircle}>
					<Icon name="upload" size={24} color="var(--color-secondary)" />
				</div>
				<p className={styles.dropLabel}>
					{dropLabel || 'Arrasta ficheiros ou procura'}
				</p>
				<p className={styles.sizeHint}>Tamanho máximo: {maxSizeLabel}</p>
			</div>

			{files.length > 0 && (
				<div className={styles.fileList}>
					<p className={styles.fileCount}>
						{fileCountLabel || `Ficheiros carregados (${files.length})`}
					</p>
					<div className={styles.fileItems}>
						{files.map((file, index) => (
							<div key={index} className={styles.fileItem}>
								<div className={styles.fileInfo}>
									<div className={styles.fileIcon}>
										<Icon name="paper" size={16} color="var(--color-secondary)" />
									</div>
									<div className={styles.fileMeta}>
										<span className={styles.fileName}>{file.name}</span>
										<span className={styles.fileSize}>
											{file.extension || 'PDF'} · {formatFileSize(file.size)}
										</span>
									</div>
								</div>
								{onRemove && (
									<button
										type="button"
										className={styles.removeBtn}
										onClick={(e) => {
											e.stopPropagation();
											onRemove(index);
										}}
										aria-label={`Remover ${file.name}`}
									>
										<Icon name="trash" size={16} color="var(--color-error)" />
									</button>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
