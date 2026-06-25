/**
 * Modal form for creating a new Service Line within a Learning Path.
 * @param {Function} onClose - Called when the modal is dismissed.
 * @param {Function} onCreated - Called after successful creation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button/Button';
import ConfirmToast from '../../../../components/ConfirmToast/ConfirmToast';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import FormAlert from '../../../../components/FormAlert/FormAlert';
import FormInput from '../../../../components/FormInput/FormInput';
import Icon from '../../../../components/Icons/Icons';
import Modal from '../../../../components/Modal/Modal';
import {
	AVAILABILITY_STATUS,
	hasErrors,
	isCheckBlocking,
	isCheckPending,
	mergeError,
	resolveErrorMessage,
	useAvailability,
	useFormValidation,
	validateRequiredPositiveIntId,
} from '../../../../validations';
import {
	PROFILE_IMAGE_MAX_FILE_SIZE_BYTES,
	uploadProfileImageToTemp,
} from '../../../../services/storage';
import {
	checkServiceLineSlugAvailability,
	createServiceLine,
	fetchAllLearningPaths,
	updateServiceLine,
} from '../../api/structureListApi';
import styles from './CreateServiceLineModal.module.css';

const EMPTY_FORM = {
	learningPathId: '',
	serviceLineName: '',
	slSlug: '',
	serviceLineDescription: '',
	imgUrl: '',
};

const SLUG_REGEX = /^[a-z0-9-]+$/;

// Normalizes a string into a URL-safe slug
function slugify(value) {
	return String(value ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\w-]+/g, '')
		.replace(/--+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
}

// Maps incoming edit data onto the form shape, coercing types to strings
function normalizeInitialData(initialData) {
	return {
		learningPathId: initialData?.learningPathId ? String(initialData.learningPathId) : '',
		serviceLineName: initialData?.serviceLineName ?? '',
		slSlug: initialData?.slSlug ?? '',
		serviceLineDescription: initialData?.serviceLineDescription ?? '',
		imgUrl: initialData?.imgUrl ?? '',
	};
}

// Synchronous client-side validation for the service line form fields
function validateServiceLineForm(values, t) {
	const errors = {};
	const learningPathLabel = t('shared.structureLabels.learningPaths', { defaultValue: 'Learning Paths' });
	const name = values.serviceLineName.trim();
	const slug = values.slSlug.trim();
	const description = values.serviceLineDescription.trim();

	errors.learningPathId = validateRequiredPositiveIntId(values.learningPathId, learningPathLabel);

	if (!name) {
		errors.serviceLineName = t('validation.fieldRequired', {
			field: t('shared.name', { defaultValue: 'Name' }),
		});
	} else if (name.length < 2) {
		errors.serviceLineName = t('validation.nameMinLength');
	} else if (name.length > 100) {
		errors.serviceLineName = t('structureList.nameMaxLength', { defaultValue: 'Name must have a maximum of 100 characters.' });
	}

	if (!slug) {
		errors.slSlug = t('validation.fieldRequired', {
			field: t('shared.slug', { defaultValue: 'Slug' }),
		});
	} else if (slug.length > 150) {
		errors.slSlug = t('structureList.slugMaxLength', { defaultValue: 'Slug must have a maximum of 150 characters.' });
	} else if (!SLUG_REGEX.test(slug)) {
		errors.slSlug = t('structureList.slugFormat', {
			defaultValue: 'Slug can only contain lowercase letters, numbers and hyphens.',
		});
	}

	if (description.length > 5000) {
		errors.serviceLineDescription = t('validation.biographyTooLong');
	}

	return errors;
}

// Maps server validation errors onto per-field messages
function extractServiceLineFieldErrors(error, fallbackMessage) {
	const issues = error?.response?.data?.errors;
	if (!Array.isArray(issues)) return {};
	const map = {
		learningPathId: 'learningPathId',
		serviceLineName: 'serviceLineName',
		slSlug: 'slSlug',
		serviceLineDescription: 'serviceLineDescription',
		imgUrl: 'imgUrl',
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

// Translates an image-upload error code into a user-facing message
function resolveImageErrorMessage(error, t) {
	if (!error?.code) return t('register.profilePictureUploadFailed');
	if (error.code === 'PROFILE_IMAGE_INVALID_FORMAT') return t('validation.profileImageInvalidFormat');
	if (error.code === 'PROFILE_IMAGE_TOO_LARGE') {
		return t('validation.profileImageTooLarge', {
			sizeMb: PROFILE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024),
		});
	}
	return t('register.profilePictureUploadFailed');
}

export default function CreateServiceLineModal({
	mode = 'create',
	initialData = null,
	targetSlug,
	defaultLearningPathId = null,
	defaultLearningPathSlug = null,
	lockLearningPath = false,
	onClose,
	onSuccess,
}) {
	// i18n translation function
	const { t } = useTranslation();
	const isEditMode = mode === 'edit';
	// Initial form values: existing data in edit mode, empty otherwise
	const initialForm = useMemo(
		() => (isEditMode ? normalizeInitialData(initialData) : EMPTY_FORM),
		[isEditMode, initialData],
	);

	// Tracks the in-flight save request
	const [saving, setSaving] = useState(false);
	// Global API error message
	const [apiError, setApiError] = useState('');
	// Per-field errors returned by the server
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	// Controls the discard-changes confirmation toast
	const [showCloseConfirm, setShowCloseConfirm] = useState(false);
	// True once the user types in the slug field (disables auto-suggestion)
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	// True while an available slug is being suggested
	const [slugSuggestionPending, setSlugSuggestionPending] = useState(false);
	// True once the name changes (gates slug auto-suggestion in edit mode)
	const [nameChangedSinceOpen, setNameChangedSinceOpen] = useState(false);

	// Currently displayed image preview URL
	const [imagePreviewUrl, setImagePreviewUrl] = useState(initialForm.imgUrl || '');
	// True while an image upload is in progress
	const [imageUploading, setImageUploading] = useState(false);
	// Image-specific error message
	const [imageError, setImageError] = useState('');

	// Learning path select options
	const [learningPathOptions, setLearningPathOptions] = useState([]);

	// Tracks whether the user has modified the form
	const isDirty = useRef(false);
	// Reference to the hidden file input
	const imageInputRef = useRef(null);
	// Holds the local object URL so it can be revoked
	const localPreviewRef = useRef('');
	// Monotonic id to ignore stale slug-suggestion responses
	const slugSuggestionRequestRef = useRef(0);
	// Normalized default learning path id passed via props
	const normalizedDefaultLearningPathId = defaultLearningPathId ? String(defaultLearningPathId) : '';

	// Memoized validator bound to the current translation function
	const validate = useCallback((values) => validateServiceLineForm(values, t), [t]);
	const form = useFormValidation({ initialValues: initialForm, validate });
	const {
		values,
		setFieldValue,
		handleBlur,
		handleChange,
		errors: liveErrors,
		markAllTouched,
		isErrorVisible,
		touched,
	} = form;

	// Loads learning path options once on mount
	useEffect(() => {
		fetchAllLearningPaths()
			.then((result) => {
				const options = (result?.items || [])
					.map((lp) => ({
						value: String(lp.learning_path_id),
						label: lp.path_title,
						slug: lp.path_slug,
					}))
					.filter((opt) => opt.value && opt.label);
				setLearningPathOptions(options);
			})
			.catch(() => setLearningPathOptions([]));
	}, []);

	// Pre-selects the learning path from the default id or slug prop
	useEffect(() => {
		if (values.learningPathId) return;
		if (normalizedDefaultLearningPathId) {
			setFieldValue('learningPathId', normalizedDefaultLearningPathId);
			return;
		}
		if (!defaultLearningPathSlug) return;
		if (learningPathOptions.length === 0) return;
		const match = learningPathOptions.find((opt) => opt.slug === defaultLearningPathSlug);
		if (match) setFieldValue('learningPathId', match.value);
	}, [
		values.learningPathId,
		normalizedDefaultLearningPathId,
		defaultLearningPathSlug,
		learningPathOptions,
		setFieldValue,
	]);

	const initialSlugTrimmed = initialForm.slSlug.trim();
	const currentSlugTrimmed = values.slSlug.trim();
	// True when editing and the slug has not changed (skips availability check)
	const isSlugUnchangedInEdit = isEditMode && currentSlugTrimmed === initialSlugTrimmed;

	// Whether the slug passes synchronous validation
	const slugSyncValid = !validateServiceLineForm(values, t).slSlug;
	// Debounced async slug availability check
	const slugCheck = useAvailability({
		value: currentSlugTrimmed,
		isValid: slugSyncValid,
		enabled: Boolean(currentSlugTrimmed) && !isSlugUnchangedInEdit,
		fetcher: checkServiceLineSlugAvailability,
		delay: 350,
	});

	// Error message when the slug is already taken
	const slugAsyncError =
		slugCheck.status === AVAILABILITY_STATUS.UNAVAILABLE && !isSlugUnchangedInEdit
			? t('structureList.slugInUse', { defaultValue: 'This slug is already in use.' })
			: null;

	// Resolves the error message to show for a field, merging sync and async sources
	const fieldError = useCallback(
		(name, asyncError) => {
			if (serverFieldErrors[name]) return serverFieldErrors[name];
			const syncError = isErrorVisible(name) ? liveErrors[name] : undefined;
			const checkedAsyncError = (isErrorVisible(name) || touched[name]) ? asyncError : undefined;
			return mergeError(syncError, checkedAsyncError);
		},
		[serverFieldErrors, isErrorVisible, liveErrors, touched],
	);

	// Revokes any leftover object URL when the component unmounts
	useEffect(() => () => {
		if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
	}, []);

	// Auto-suggests an available slug as the name changes (unless manually edited)
	useEffect(() => {
		if (slugManuallyEdited) return undefined;
		if (isEditMode && !nameChangedSinceOpen) return undefined;

		const baseSlug = slugify(values.serviceLineName);
		const requestId = ++slugSuggestionRequestRef.current;

		if (!baseSlug) {
			setSlugSuggestionPending(false);
			setFieldValue('slSlug', '');
			return undefined;
		}

		setSlugSuggestionPending(true);
		const timer = setTimeout(async () => {
			try {
				for (let counter = 0; counter < 20; counter += 1) {
					const candidate = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
					const result = await checkServiceLineSlugAvailability(candidate);
					if (requestId !== slugSuggestionRequestRef.current) return;
					if (result?.available) {
						setFieldValue('slSlug', candidate);
						setSlugSuggestionPending(false);
						return;
					}
				}
				if (requestId !== slugSuggestionRequestRef.current) return;
				const suffix = Date.now().toString().slice(-6);
				const safeBase = baseSlug.slice(0, 143);
				setFieldValue('slSlug', `${safeBase}-${suffix}`);
				setSlugSuggestionPending(false);
			} catch {
				if (requestId !== slugSuggestionRequestRef.current) return;
				setFieldValue('slSlug', baseSlug);
				setSlugSuggestionPending(false);
			}
		}, 280);

		return () => clearTimeout(timer);
	}, [values.serviceLineName, slugManuallyEdited, setFieldValue, isEditMode, nameChangedSinceOpen]);

	// Field change handler: updates value, marks dirty, clears errors, tracks slug/name edits
	const onChange = useCallback((event) => {
		const { name } = event.target;
		handleChange(event);
		isDirty.current = true;
		setServerFieldErrors((prev) => ({ ...prev, [name]: '' }));
		setApiError('');
		if (name === 'slSlug') setSlugManuallyEdited(true);
		if (name === 'serviceLineName') setNameChangedSinceOpen(true);
	}, [handleChange]);

	// Uploads the chosen image to temp storage and updates the preview
	const onImageChange = useCallback(async (event) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		isDirty.current = true;
		setImageError('');
		setImageUploading(true);

		if (localPreviewRef.current) {
			URL.revokeObjectURL(localPreviewRef.current);
			localPreviewRef.current = '';
		}
		const localPreview = URL.createObjectURL(file);
		localPreviewRef.current = localPreview;
		setImagePreviewUrl(localPreview);

		try {
			const { publicUrl } = await uploadProfileImageToTemp(file);
			if (localPreviewRef.current) {
				URL.revokeObjectURL(localPreviewRef.current);
				localPreviewRef.current = '';
			}
			setImagePreviewUrl(publicUrl);
			setFieldValue('imgUrl', publicUrl);
		} catch (error) {
			setImageError(resolveImageErrorMessage(error, t));
			if (localPreviewRef.current) {
				URL.revokeObjectURL(localPreviewRef.current);
				localPreviewRef.current = '';
			}
			setImagePreviewUrl(values.imgUrl || '');
		} finally {
			setImageUploading(false);
		}
	}, [setFieldValue, t, values.imgUrl]);

	// Clears the selected image and resets the file input
	const clearImage = useCallback(() => {
		if (localPreviewRef.current) {
			URL.revokeObjectURL(localPreviewRef.current);
			localPreviewRef.current = '';
		}
		isDirty.current = true;
		setImagePreviewUrl('');
		setImageError('');
		setFieldValue('imgUrl', '');
		if (imageInputRef.current) imageInputRef.current.value = '';
	}, [setFieldValue]);

	// Validates, blocks on pending checks, then creates or updates the service line
	const handleSubmit = useCallback(async (event) => {
		event.preventDefault();
		markAllTouched();

		if (hasErrors(liveErrors)) return;
		if (slugAsyncError) return;
		if (isCheckBlocking(slugCheck.status) && !isSlugUnchangedInEdit) return;
		if (slugSuggestionPending) {
			setApiError(t('register.checkingAvailability', { defaultValue: 'Checking availability...' }));
			return;
		}
		if (imageUploading) {
			setApiError(t('register.profilePictureUploadInProgress'));
			return;
		}

		setApiError('');
		setSaving(true);

		try {
			const payload = {
				learningPathId: Number(values.learningPathId),
				serviceLineName: values.serviceLineName.trim(),
				slSlug: values.slSlug.trim(),
				serviceLineDescription: values.serviceLineDescription.trim() || null,
				imgUrl: values.imgUrl || null,
			};
			const result = isEditMode
				? await updateServiceLine(targetSlug || initialSlugTrimmed, payload)
				: await createServiceLine(payload);
			onSuccess?.(result);
			onClose();
		} catch (error) {
			setServerFieldErrors((prev) => ({
				...prev,
				...extractServiceLineFieldErrors(error, t('validation.invalidValue')),
			}));
			setApiError(resolveErrorMessage(error));
		} finally {
			setSaving(false);
		}
	}, [
		liveErrors,
		markAllTouched,
		slugAsyncError,
		slugCheck.status,
		isSlugUnchangedInEdit,
		slugSuggestionPending,
		imageUploading,
		t,
		values.learningPathId,
		values.serviceLineName,
		values.slSlug,
		values.serviceLineDescription,
		values.imgUrl,
		isEditMode,
		targetSlug,
		initialSlugTrimmed,
		onSuccess,
		onClose,
	]);

	// Prompts for confirmation if dirty, otherwise closes immediately
	const handleClose = useCallback(() => {
		if (isDirty.current) {
			setShowCloseConfirm(true);
			return;
		}
		onClose();
	}, [onClose]);

	// Derived disabled/error flags for the form controls
	const learningPathDisabled = lockLearningPath || (isEditMode && Boolean(initialForm.learningPathId || defaultLearningPathSlug));
	const slugError = fieldError('slSlug', slugAsyncError);
	const submitDisabled = saving || isCheckPending(slugCheck.status) || imageUploading || slugSuggestionPending;

	// Renders the contextual slug availability hint below the slug input
	const renderSlugHint = () => {
		if (slugError) return null;
		if (!values.slSlug || !slugSyncValid) return null;
		if (isSlugUnchangedInEdit) {
			return <p className={styles.hintOk}>{t('structureList.slugAvailable', { defaultValue: 'Slug is available.' })}</p>;
		}
		if (slugSuggestionPending) {
			return (
				<p className={styles.hintMuted}>
					{t('structureList.suggestingSlug', { defaultValue: 'Suggesting available slug...' })}
				</p>
			);
		}
		if (slugCheck.status === AVAILABILITY_STATUS.CHECKING) {
			return <p className={styles.hintMuted}>{t('register.checkingAvailability')}</p>;
		}
		if (slugCheck.status === AVAILABILITY_STATUS.AVAILABLE) {
			return <p className={styles.hintOk}>{t('structureList.slugAvailable', { defaultValue: 'Slug is available.' })}</p>;
		}
		return null;
	};

	return (
		<Modal
			title={isEditMode
				? t('adminServiceLines.editServiceLine', { defaultValue: 'Edit Service Line' })
				: t('structureList.newServiceLine', { defaultValue: 'New Service Line' })}
			onClose={handleClose}
			size="lg"
			footer={(
				<>
					<Button variant="outlined" onClick={handleClose}>
						{t('shared.cancel')}
					</Button>
					<Button loading={saving} disabled={submitDisabled} onClick={handleSubmit}>
						{isEditMode ? t('shared.save') : t('shared.create')}
					</Button>
				</>
			)}
		>
			<form id="create-service-line-form" onSubmit={handleSubmit} className={styles.form} noValidate>
				<div>
					<label htmlFor="sl_lp" className={styles.fieldLabel}>
						{t('shared.structureLabels.learningPaths', { defaultValue: 'Learning Paths' })}<span className={styles.required}> *</span>
					</label>
					<CustomSelect
						id="sl_lp"
						name="learningPathId"
						value={values.learningPathId}
						onChange={onChange}
						onBlur={handleBlur}
						options={learningPathOptions}
						placeholder={t('shared.select', { defaultValue: 'Select...' })}
						disabled={learningPathDisabled}
						error={Boolean(fieldError('learningPathId'))}
					/>
					{fieldError('learningPathId') && (
						<div className="invalid-feedback d-block">{fieldError('learningPathId')}</div>
					)}
				</div>

				<div className={styles.grid}>
					<FormInput
						label={t('shared.name')}
						name="serviceLineName"
						value={values.serviceLineName}
						onChange={onChange}
						onBlur={handleBlur}
						error={fieldError('serviceLineName')}
						required
					/>
					<div>
						<FormInput
							label={t('shared.slug')}
							name="slSlug"
							value={values.slSlug}
							onChange={onChange}
							onBlur={handleBlur}
							error={slugError}
							required
						/>
						{renderSlugHint()}
					</div>
				</div>

				<div>
					<label htmlFor="sl_description" className={styles.fieldLabel}>
						{t('shared.description')}
					</label>
					<textarea
						id="sl_description"
						name="serviceLineDescription"
						value={values.serviceLineDescription}
						onChange={onChange}
						onBlur={handleBlur}
						rows={4}
						maxLength={5000}
						className={`form-control ${styles.textarea} ${fieldError('serviceLineDescription') ? 'is-invalid' : ''}`}
					/>
					{fieldError('serviceLineDescription') && (
						<div className="invalid-feedback d-block">{fieldError('serviceLineDescription')}</div>
					)}
				</div>

				<div>
					<label htmlFor="sl_image" className={styles.fieldLabel}>
						{t('register.profilePicture', { defaultValue: 'Image' })}
					</label>
					<input
						ref={imageInputRef}
						id="sl_image"
						type="file"
						className={styles.hiddenInput}
						accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/heic,image/heif"
						onChange={onImageChange}
					/>
					{imagePreviewUrl ? (
						<div className={styles.previewWrapper}>
							<img
								src={imagePreviewUrl}
								alt={t('register.profilePicturePreviewAlt', { defaultValue: 'Selected image preview' })}
								className={styles.preview}
							/>
							<div className={styles.imageActions}>
								<Button type="button" variant="outlined" size="sm" onClick={() => imageInputRef.current?.click()} disabled={imageUploading}>
									{t('register.profilePictureChange', { defaultValue: 'Choose another image' })}
								</Button>
								<Button type="button" variant="outlined" size="sm" color="danger" onClick={clearImage} disabled={imageUploading}>
									<Icon name="trash" size={12} aria-hidden="true" className="me-1" />
									{t('register.profilePictureRemove', { defaultValue: 'Remove image' })}
								</Button>
							</div>
						</div>
					) : (
						<button type="button" className={styles.imagePicker} onClick={() => imageInputRef.current?.click()} disabled={imageUploading}>
							<Icon name="photo" size={20} color="currentColor" fill="currentColor" stroke="none" aria-hidden="true" />
							<span>{t('register.profilePictureChoose', { defaultValue: 'Click to choose an image' })}</span>
						</button>
					)}
					{imageUploading && <p className={styles.hintMuted}>{t('register.profilePictureUploading', { defaultValue: 'Uploading image...' })}</p>}
					{imageError && <div className={styles.fieldError}>{imageError}</div>}
					<p className={styles.hintMuted}>
						{t('register.profilePictureHint', {
							sizeMb: PROFILE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024),
							defaultValue: 'Accepted image formats only. Maximum size: {{sizeMb}}MB.',
						})}
					</p>
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
