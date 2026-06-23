/**
 * Modal form for creating a new progression Level within an Area.
 * @param {Function} onClose - Called when the modal is dismissed.
 * @param {Function} onCreated - Called after successful creation.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button/Button';
import ConfirmToast from '../../../../components/ConfirmToast/ConfirmToast';
import FormAlert from '../../../../components/FormAlert/FormAlert';
import FormInput from '../../../../components/FormInput/FormInput';
import Modal from '../../../../components/Modal/Modal';
import {
	hasErrors,
	resolveErrorMessage,
	useFormValidation,
} from '../../../../validations';
import { createLevel, updateLevel } from '../../api/structureListApi';
import styles from './CreateLevelModal.module.css';

const EMPTY_FORM = {
	stageTitle: '',
	stageCode: '',
	stageSequence: '',
	stageDescription: '',
};

function normalizeInitialData(initialData) {
	return {
		stageTitle: initialData?.stageTitle ?? '',
		stageCode: initialData?.stageCode ?? '',
		stageSequence: initialData?.stageSequence != null ? String(initialData.stageSequence) : '',
		stageDescription: initialData?.stageDescription ?? '',
	};
}

function validateLevelForm(values, t) {
	const errors = {};

	const title = (values.stageTitle || '').trim();
	if (!title) {
		errors.stageTitle = t('validation.fieldRequired', {
			field: t('shared.name', { defaultValue: 'Name' }),
		});
	} else if (title.length < 2) {
		errors.stageTitle = t('validation.nameMinLength');
	} else if (title.length > 100) {
		errors.stageTitle = t('structureList.nameMaxLength', { defaultValue: 'Name must have a maximum of 100 characters.' });
	}

	const code = (values.stageCode || '').trim();
	if (!code) {
		errors.stageCode = t('validation.fieldRequired', {
			field: t('structureDetail.stageCode', { defaultValue: 'Stage Code' }),
		});
	} else if (code.length > 20) {
		errors.stageCode = t('structureDetail.stageCodeMaxLength', { defaultValue: 'Stage code cannot exceed 20 characters.' });
	}

	const seq = values.stageSequence;
	if (seq !== '' && seq != null) {
		const num = Number(seq);
		if (!Number.isInteger(num) || num <= 0) {
			errors.stageSequence = t('structureDetail.sequencePositiveInt', { defaultValue: 'Sequence must be a positive integer.' });
		}
	}

	if ((values.stageDescription || '').trim().length > 5000) {
		errors.stageDescription = t('validation.biographyTooLong');
	}

	return errors;
}

function extractLevelFieldErrors(error, fallbackMessage) {
	const issues = error?.response?.data?.errors;
	if (!Array.isArray(issues)) return {};
	const map = {
		stageTitle: 'stageTitle',
		stageCode: 'stageCode',
		stageSequence: 'stageSequence',
		stageDescription: 'stageDescription',
		areaId: 'areaId',
	};
	const parsed = {};
	for (const issue of issues) {
		const rawField = issue?.field;
		const fieldName = Array.isArray(rawField) ? rawField[0] : rawField;
		const mapped = map[fieldName];
		if (!mapped) continue;
		parsed[mapped] = issue?.message || issue?.detail || fallbackMessage;
	}
	return parsed;
}

export default function CreateLevelModal({
	mode = 'create',
	initialData = null,
	targetStageCode = null,
	defaultAreaId = null,
	defaultAreaName = '',
	onClose,
	onSuccess,
}) {
	const { t } = useTranslation();
	const isEditMode = mode === 'edit';
	const initialForm = useMemo(
		() => (isEditMode ? normalizeInitialData(initialData) : EMPTY_FORM),
		[isEditMode, initialData],
	);

	const [saving, setSaving] = useState(false);
	const [apiError, setApiError] = useState('');
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	const [showCloseConfirm, setShowCloseConfirm] = useState(false);

	const isDirty = useRef(false);

	const validate = useCallback((values) => validateLevelForm(values, t), [t]);
	const form = useFormValidation({ initialValues: initialForm, validate });
	const {
		values,
		handleBlur,
		handleChange,
		errors: liveErrors,
		markAllTouched,
		isErrorVisible,
	} = form;

	const fieldError = useCallback(
		(name) => {
			if (serverFieldErrors[name]) return serverFieldErrors[name];
			return isErrorVisible(name) ? liveErrors[name] : undefined;
		},
		[serverFieldErrors, isErrorVisible, liveErrors],
	);

	const onChange = useCallback((event) => {
		const { name } = event.target;
		handleChange(event);
		isDirty.current = true;
		setServerFieldErrors((prev) => ({ ...prev, [name]: '' }));
		setApiError('');
	}, [handleChange]);

	const handleSubmit = useCallback(async (event) => {
		event.preventDefault();
		markAllTouched();

		if (hasErrors(liveErrors)) return;

		setApiError('');
		setSaving(true);

		try {
			const payload = {
				stageTitle: values.stageTitle.trim(),
				stageCode: values.stageCode.trim(),
				stageDescription: values.stageDescription.trim() || null,
				stageSequence: values.stageSequence !== '' ? Number(values.stageSequence) : null,
				...(defaultAreaId ? { areaId: Number(defaultAreaId) } : {}),
			};
			const result = isEditMode
				? await updateLevel(targetStageCode, payload)
				: await createLevel(payload);
			onSuccess?.(result);
			onClose();
		} catch (error) {
			setServerFieldErrors((prev) => ({
				...prev,
				...extractLevelFieldErrors(error, t('validation.invalidValue')),
			}));
			setApiError(resolveErrorMessage(error));
		} finally {
			setSaving(false);
		}
	}, [
		liveErrors,
		markAllTouched,
		values.stageTitle,
		values.stageCode,
		values.stageDescription,
		values.stageSequence,
		defaultAreaId,
		isEditMode,
		targetStageCode,
		onSuccess,
		onClose,
		t,
	]);

	const handleClose = useCallback(() => {
		if (isDirty.current) {
			setShowCloseConfirm(true);
			return;
		}
		onClose();
	}, [onClose]);

	return (
		<Modal
			title={isEditMode
				? t('structureDetail.editLevel', { defaultValue: 'Edit Level' })
				: t('structureDetail.newLevel', { defaultValue: 'New Level' })}
			onClose={handleClose}
			size="lg"
			footer={(
				<>
					<Button variant="outlined" onClick={handleClose}>
						{t('shared.cancel')}
					</Button>
					<Button loading={saving} disabled={saving} onClick={handleSubmit}>
						{isEditMode ? t('shared.save') : t('shared.create')}
					</Button>
				</>
			)}
		>
			<form id="create-level-form" onSubmit={handleSubmit} className={styles.form} noValidate>
				{defaultAreaName && (
					<div>
						<label className={styles.fieldLabel}>
							{t('shared.structureLabels.areas', { defaultValue: 'Area' })}
						</label>
						<div className={styles.lockedField}>{defaultAreaName}</div>
					</div>
				)}

				<div className={styles.grid}>
					<FormInput
						label={t('shared.name')}
						name="stageTitle"
						value={values.stageTitle}
						onChange={onChange}
						onBlur={handleBlur}
						error={fieldError('stageTitle')}
						required
					/>
					<FormInput
						label={t('structureDetail.sequence', { defaultValue: '# Sequence' })}
						name="stageSequence"
						type="number"
						min="1"
						value={values.stageSequence}
						onChange={onChange}
						onBlur={handleBlur}
						error={fieldError('stageSequence')}
					/>
				</div>

				<FormInput
					label={t('structureDetail.stageCode', { defaultValue: 'Stage Code' })}
					name="stageCode"
					value={values.stageCode}
					onChange={onChange}
					onBlur={handleBlur}
					error={fieldError('stageCode')}
					required
				/>

				<div>
					<label htmlFor="level_description" className={styles.fieldLabel}>
						{t('shared.description')}
					</label>
					<textarea
						id="level_description"
						name="stageDescription"
						value={values.stageDescription}
						onChange={onChange}
						onBlur={handleBlur}
						rows={4}
						maxLength={5000}
						className={`form-control ${styles.textarea} ${fieldError('stageDescription') ? 'is-invalid' : ''}`}
					/>
					{fieldError('stageDescription') && (
						<div className="invalid-feedback d-block">{fieldError('stageDescription')}</div>
					)}
				</div>

				<FormAlert message={apiError} />
			</form>

			<ConfirmToast
				open={showCloseConfirm}
				message={t('shared.confirmDiscardChanges')}
				confirmLabel={t('shared.yes')}
				cancelLabel={t('shared.no')}
				onConfirm={onClose}
				onCancel={() => setShowCloseConfirm(false)}
			/>
		</Modal>
	);
}
