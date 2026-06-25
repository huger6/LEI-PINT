import { useRef, useState, useCallback } from 'react';

const MAX_HISTORY = 30;

// Hook providing undo/redo history for the Fabric badge canvas.
export default function useCanvasHistory(fabricRef) {
	// Stores serialized canvas states that can be stepped back to.
	const undoStack = useRef([]);
	// Stores serialized canvas states that can be stepped forward to.
	const redoStack = useRef([]);
	// Flag set to true while a history restore is in progress to suppress re-saves.
	const isRestoring = useRef(false);
	// Tracks whether there are states available to undo.
	const [canUndo, setCanUndo] = useState(false);
	// Tracks whether there are states available to redo.
	const [canRedo, setCanRedo] = useState(false);

	// Syncs the canUndo/canRedo booleans with the current stack lengths.
	const refresh = useCallback(() => {
		setCanUndo(undoStack.current.length > 0);
		setCanRedo(redoStack.current.length > 0);
	}, []);

	// Serializes the current canvas state and pushes it onto the undo stack.
	const saveState = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || isRestoring.current) return;
		const json = JSON.stringify(fc.toJSON());
		undoStack.current.push(json);
		if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
		redoStack.current = [];
		refresh();
	}, [fabricRef, refresh]);

	// Reverts the canvas to the previous state from the undo stack.
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

	// Re-applies the next state from the redo stack.
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
