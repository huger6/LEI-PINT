import PropTypes from 'prop-types';
import styles from './PropertiesPanel.module.css';

const FONT_OPTIONS = [
	{ value: 'Inter, sans-serif', label: 'Inter' },
	{ value: 'Roboto, sans-serif', label: 'Roboto' },
	{ value: 'Poppins, sans-serif', label: 'Poppins' },
	{ value: 'Montserrat, sans-serif', label: 'Montserrat' },
	{ value: 'Playfair Display, serif', label: 'Playfair Display' },
	{ value: 'Oswald, sans-serif', label: 'Oswald' },
];

export default function PropertiesPanel({
	selected, props, onUpdateProp, onSaveState,
	canvasBg, onUpdateCanvasBg, t,
}) {
	// Updates a color property on the selected object and saves the canvas state.
	const handleColorCommit = (key, value) => {
		onUpdateProp(key, value);
		onSaveState();
	};

	// Updates the appropriate gradient color stop (start or end) on the selected object.
	const handleGradientColor = (which, value) => {
		if (which === 'start') onUpdateProp('gradientStart', value);
		else onUpdateProp('gradientEnd', value);
	};

	// Saves the canvas history state after a gradient color change is committed.
	const handleGradientCommit = () => {
		onSaveState();
	};

	return (
		<div className={styles.properties}>
			{selected ? (
				<>
					{/* Transform */}
					<div className={styles.propGroup}>
						<p className={styles.panelTitle}>{t('badgeEditor.transform')}</p>
						<div className={styles.propRow}>
							<span className={styles.propLabel}>{t('badgeEditor.rotation')}</span>
							<input
								type="number"
								className={styles.numberInput}
								min={0}
								max={360}
								value={props.angle ?? 0}
								onChange={(e) => onUpdateProp('angle', Number(e.target.value))}
								onBlur={onSaveState}
							/>
							<span className={styles.propLabel}>°</span>
						</div>
					</div>

					{/* Fill & Stroke */}
					<div className={styles.propGroup}>
						<p className={styles.panelTitle}>{t('badgeEditor.fillStroke')}</p>

						{/* Fill mode toggle */}
						<div className={styles.propRow}>
							<div className={styles.toggleGroup}>
								<button
									className={props.fillMode === 'solid' ? styles.toggleBtnActive : styles.toggleBtn}
									onClick={() => onUpdateProp('fillMode', 'solid')}
								>
									{t('badgeEditor.solidFill')}
								</button>
								<button
									className={props.fillMode === 'gradient' ? styles.toggleBtnActive : styles.toggleBtn}
									onClick={() => onUpdateProp('fillMode', 'gradient')}
								>
									{t('badgeEditor.gradientFill')}
								</button>
							</div>
						</div>

						{props.fillMode === 'gradient' ? (
							<>
								<div className={styles.propRow}>
									<span className={styles.propLabel}>{t('badgeEditor.gradientStart')}</span>
									<input
										type="color"
										className={styles.colorInput}
										value={props.gradientStart || '#000000'}
										onInput={(e) => handleGradientColor('start', e.target.value)}
										onChange={handleGradientCommit}
									/>
								</div>
								<div className={styles.propRow}>
									<span className={styles.propLabel}>{t('badgeEditor.gradientEnd')}</span>
									<input
										type="color"
										className={styles.colorInput}
										value={props.gradientEnd || '#ffffff'}
										onInput={(e) => handleGradientColor('end', e.target.value)}
										onChange={handleGradientCommit}
									/>
								</div>
							</>
						) : (
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.fill')}</span>
								<input
									type="color"
									className={styles.colorInput}
									value={props.fill || '#000000'}
									onInput={(e) => onUpdateProp('fill', e.target.value)}
									onChange={() => onSaveState()}
								/>
							</div>
						)}

						<div className={styles.propRow}>
							<span className={styles.propLabel}>{t('badgeEditor.stroke')}</span>
							<input
								type="color"
								className={styles.colorInput}
								value={props.stroke || '#000000'}
								onInput={(e) => onUpdateProp('stroke', e.target.value)}
								onChange={() => onSaveState()}
							/>
						</div>
						<div className={styles.propRow}>
							<span className={styles.propLabel}>{t('badgeEditor.strokeWidth')}</span>
							<input
								type="number"
								className={styles.numberInput}
								min={0}
								max={20}
								value={props.strokeWidth || 0}
								onChange={(e) => onUpdateProp('strokeWidth', Number(e.target.value))}
								onBlur={onSaveState}
							/>
						</div>
					</div>

					{/* Opacity */}
					<div className={styles.propGroup}>
						<p className={styles.panelTitle}>{t('badgeEditor.opacity')}</p>
						<div className={styles.propRow}>
							<input
								type="range"
								className={styles.rangeSlider}
								min={0}
								max={100}
								value={props.opacity ?? 100}
								onChange={(e) => onUpdateProp('opacity', Number(e.target.value))}
								onMouseUp={onSaveState}
								onTouchEnd={onSaveState}
							/>
							<span className={styles.propLabel}>{props.opacity ?? 100}%</span>
						</div>
					</div>

					{/* Typography (text only) */}
					{props.isText && (
						<div className={styles.propGroup}>
							<p className={styles.panelTitle}>{t('badgeEditor.typography')}</p>

							{/* Font family */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.fontFamily')}</span>
								<select
									className={styles.fontSelect}
									value={props.fontFamily || 'Inter, sans-serif'}
									onChange={(e) => {
										onUpdateProp('fontFamily', e.target.value);
										onSaveState();
									}}
								>
									{FONT_OPTIONS.map((f) => (
										<option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
											{f.label}
										</option>
									))}
								</select>
							</div>

							{/* Font size */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.fontSize')}</span>
								<input
									type="number"
									className={styles.numberInput}
									min={8}
									max={200}
									value={props.fontSize || 24}
									onChange={(e) => onUpdateProp('fontSize', Number(e.target.value))}
									onBlur={onSaveState}
								/>
							</div>

							{/* Bold / Italic */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.fontStyle')}</span>
								<div className={styles.toggleGroup}>
									<button
										className={props.fontWeight === 'bold' ? styles.toggleBtnActive : styles.toggleBtn}
										onClick={() => {
											onUpdateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold');
											onSaveState();
										}}
									>
										B
									</button>
									<button
										className={props.fontStyle === 'italic' ? styles.toggleBtnActive : styles.toggleBtn}
										onClick={() => {
											onUpdateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic');
											onSaveState();
										}}
									>
										I
									</button>
								</div>
							</div>

							{/* Text alignment */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.textAlign')}</span>
								<div className={styles.toggleGroup}>
									<button
										className={props.textAlign === 'left' ? styles.toggleBtnActive : styles.toggleBtn}
										onClick={() => { onUpdateProp('textAlign', 'left'); onSaveState(); }}
										title={t('badgeEditor.alignLeft')}
									>
										<i className="bi bi-text-left" />
									</button>
									<button
										className={props.textAlign === 'center' ? styles.toggleBtnActive : styles.toggleBtn}
										onClick={() => { onUpdateProp('textAlign', 'center'); onSaveState(); }}
										title={t('badgeEditor.alignCenter')}
									>
										<i className="bi bi-text-center" />
									</button>
									<button
										className={props.textAlign === 'right' ? styles.toggleBtnActive : styles.toggleBtn}
										onClick={() => { onUpdateProp('textAlign', 'right'); onSaveState(); }}
										title={t('badgeEditor.alignRight')}
									>
										<i className="bi bi-text-right" />
									</button>
								</div>
							</div>

							{/* Text color */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.textColor')}</span>
								<input
									type="color"
									className={styles.colorInput}
									value={props.fill || '#000000'}
									onInput={(e) => onUpdateProp('fill', e.target.value)}
									onChange={() => onSaveState()}
								/>
							</div>

							{/* Letter spacing */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.letterSpacing')}</span>
								<input
									type="number"
									className={styles.numberInput}
									min={-200}
									max={1000}
									step={10}
									value={props.charSpacing ?? 0}
									onChange={(e) => onUpdateProp('charSpacing', Number(e.target.value))}
									onBlur={onSaveState}
								/>
							</div>

							{/* Line height */}
							<div className={styles.propRow}>
								<span className={styles.propLabel}>{t('badgeEditor.lineHeight')}</span>
								<input
									type="number"
									className={styles.numberInput}
									min={0.5}
									max={3}
									step={0.1}
									value={props.lineHeight ?? 1.16}
									onChange={(e) => onUpdateProp('lineHeight', Number(e.target.value))}
									onBlur={onSaveState}
								/>
							</div>
						</div>
					)}
				</>
			) : (
				<div className={styles.propGroup}>
					<p className={styles.noSelection}>{t('badgeEditor.noSelection')}</p>
				</div>
			)}

			{/* Canvas background — always visible */}
			<div className={styles.propGroup}>
				<p className={styles.panelTitle}>{t('badgeEditor.canvasBg')}</p>
				<div className={styles.propRow}>
					<span className={styles.propLabel}>{t('badgeEditor.fill')}</span>
					<input
						type="color"
						className={styles.colorInput}
						value={canvasBg}
						onInput={(e) => onUpdateCanvasBg(e.target.value)}
						onChange={() => onSaveState()}
					/>
				</div>
			</div>
		</div>
	);
}

PropertiesPanel.propTypes = {
	selected: PropTypes.object,
	props: PropTypes.object.isRequired,
	onUpdateProp: PropTypes.func.isRequired,
	onSaveState: PropTypes.func.isRequired,
	canvasBg: PropTypes.string.isRequired,
	onUpdateCanvasBg: PropTypes.func.isRequired,
	t: PropTypes.func.isRequired,
};
