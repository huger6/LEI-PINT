import { useRef, useState, useCallback } from 'react';

const MAX_HISTORY = 30;

export default function useCanvasHistory(fabricRef) {
	const undoStack = useRef([]);
	const redoStack = useRef([]);
	const isRestoring = useRef(false);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);

	const refresh = useCallback(() => {
		setCanUndo(undoStack.current.length > 0);
		setCanRedo(redoStack.current.length > 0);
	}, []);

	const saveState = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || isRestoring.current) return;
		const json = JSON.stringify(fc.toJSON());
		undoStack.current.push(json);
		if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
		redoStack.current = [];
		refresh();
	}, [fabricRef, refresh]);

	const undo = useCallback(async () => {
		const fc = fabricRef.current;
		if (!fc || undoStack.current.length === 0) return;
		isRestoring.current = true;
		const currentState = JSON.stringify(fc.toJSON());
		redoStack.current.push(currentState);
		const prev = undoStack.current.pop();
		await fc.loadFromJSON(prev);
		fc.requestRenderAll();
		isRestoring.current = false;
		refresh();
	}, [fabricRef, refresh]);

	const redo = useCallback(async () => {
		const fc = fabricRef.current;
		if (!fc || redoStack.current.length === 0) return;
		isRestoring.current = true;
		const currentState = JSON.stringify(fc.toJSON());
		undoStack.current.push(currentState);
		const next = redoStack.current.pop();
		await fc.loadFromJSON(next);
		fc.requestRenderAll();
		isRestoring.current = false;
		refresh();
	}, [fabricRef, refresh]);

	return { saveState, undo, redo, canUndo, canRedo, isRestoring };
}
