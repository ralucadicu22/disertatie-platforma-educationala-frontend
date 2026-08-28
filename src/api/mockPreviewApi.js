
export function createMockPreviewApi(config) {
    return {
        post: async (url, body) => {
            await new Promise(r => setTimeout(r, 100));

            if (url === '/exercises/check-element') {
                const correctIds = config.solution?.correctElementIds || [];
                return {
                    data: {
                        elementId: body.elementId,
                        correct: correctIds.includes(body.elementId),
                    },
                };
            }

            if (url === '/exercises/check-placement') {
                const mapping = config.solution?.dropMapping || {};
                return {
                    data: {
                        draggableId: body.draggableId,
                        targetId: body.targetId,
                        correct: mapping[body.draggableId] === body.targetId,
                    },
                };
            }

            if (url === '/exercises/submit') {
                return { data: computeSubmitResult(config, body.answer) };
            }

            throw new Error(`Mock API: endpoint ${url} nu e implementat pentru preview`);
        },
    };
}

function computeSubmitResult(config, answer) {
    const type = config.meta?.type;
    const scoringMode = config.settings?.scoringMode || 'integral';

    if (type === 'FIND_AND_SELECT') {
        const correctIds = new Set(config.solution?.correctElementIds || []);
        const selectedIds = new Set(Array.isArray(answer) ? answer : []);

        const correctlySelected = [...correctIds].filter(id => selectedIds.has(id));
        const incorrectlySelected = [...selectedIds].filter(id => !correctIds.has(id));

        const foundAll = correctlySelected.length === correctIds.size;
        const noMistakes = incorrectlySelected.length === 0;

        const correct = scoringMode === 'partial' ? foundAll : (foundAll && noMistakes);
        const score = correctIds.size === 0 ? 0 : correctlySelected.length / correctIds.size;

        return {
            correct, score,
            attemptsRemaining: null,
            maxAttempts: config.settings?.maxAttempts || 3,
            attemptNumber: 1,
            details: {
                correctElementIds: [...correctIds],
                correctlySelectedIds: correctlySelected,
                incorrectlySelectedIds: incorrectlySelected,
            },
        };
    }

    if (type === 'DRAG_AND_DROP') {
        const correctMapping = config.solution?.dropMapping || {};
        const submittedMapping = answer || {};

        let correctPlacements = 0;
        Object.entries(correctMapping).forEach(([drag, target]) => {
            if (submittedMapping[drag] === target) correctPlacements++;
        });

        const totalCorrect = Object.keys(correctMapping).length;
        const allCorrect = correctPlacements === totalCorrect;
        const noExtra = Object.keys(submittedMapping).length <= totalCorrect;

        const correct = scoringMode === 'partial' ? allCorrect : (allCorrect && noExtra);
        const score = totalCorrect === 0 ? 0 : correctPlacements / totalCorrect;

        return {
            correct, score,
            attemptsRemaining: null,
            maxAttempts: config.settings?.maxAttempts || 3,
            attemptNumber: 1,
            details: {
                correctMapping,
                submittedMapping,
                correctPlacements,
            },
        };
    }

    return {
        correct: false, score: 0,
        attemptsRemaining: null,
        maxAttempts: config.settings?.maxAttempts || 3,
        attemptNumber: 1,
        details: {},
    };
}