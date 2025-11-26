/**
 * Valuation Form Component
 * Handles dynamic parameter form generation and valuation calculation
 */

class ValuationForm {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.form = document.getElementById('valuationForm');
        this.parametersContainer = document.getElementById('parametersContainer');
        this.formError = document.getElementById('formError');

        this.currentTicker = null;
        this.selectedModel = null;
        this.modelInputs = [];
        this.parameterValues = {};

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.form.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        this.form.addEventListener('reset', () => {
            this.resetForm();
        });

        // Listen for model selection
        document.addEventListener('model-selected', (e) => {
            this.handleModelSelected(e.detail);
        });

        // Listen for ticker selection
        document.addEventListener('ticker-selected', (e) => {
            this.currentTicker = e.detail.ticker;
        });
    }

    /**
     * Handle model selection
     */
    async handleModelSelected(detail) {
        const { modelId, modelName } = detail;
        this.selectedModel = modelId;

        // Load model inputs
        await this.loadModelInputs(modelId);
    }

    /**
     * Load model inputs configuration
     */
    async loadModelInputs(modelId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/models/get-inputs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_id: modelId,
                    ticker: this.currentTicker
                })
            });

            if (!response.ok) throw new Error('Failed to load model inputs');

            const data = await response.json();
            this.modelInputs = data.inputs || [];

            // Render form fields
            this.renderFormFields();

        } catch (error) {
            console.error('Error loading model inputs:', error);
            this.showError('Failed to load model parameters: ' + error.message);
        }
    }

    /**
     * Render form fields
     */
    renderFormFields() {
        // Clear container
        this.parametersContainer.innerHTML = '';

        if (this.modelInputs.length === 0) {
            const noInputs = document.createElement('p');
            noInputs.textContent = 'No parameters to configure for this model.';
            noInputs.style.color = 'var(--text-secondary)';
            noInputs.style.textAlign = 'center';
            this.parametersContainer.appendChild(noInputs);
            return;
        }

        // Create form fields
        this.modelInputs.forEach(input => {
            const group = this.createParameterGroup(input);
            this.parametersContainer.appendChild(group);
        });

        // Clear previous error
        this.hideError();
    }

    /**
     * Create a parameter group (label + input + tooltip)
     */
    createParameterGroup(input) {
        const group = document.createElement('div');
        group.className = 'parameter-group';

        // Label with tooltip
        const labelWrapper = document.createElement('div');
        labelWrapper.className = 'parameter-label-wrapper';

        const label = document.createElement('label');
        label.className = 'parameter-label';
        label.htmlFor = `param-${input.name}`;
        label.textContent = input.display_name || input.name;

        labelWrapper.appendChild(label);

        if (input.description) {
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip-icon';
            tooltip.textContent = '?';
            tooltip.setAttribute('data-tooltip', input.description);
            tooltip.title = input.description;
            labelWrapper.appendChild(tooltip);
        }

        group.appendChild(labelWrapper);

        // Input field based on type
        let inputElement;

        switch (input.type) {
            case 'number':
                inputElement = this.createNumberInput(input);
                break;
            case 'range':
                inputElement = this.createRangeInput(input);
                break;
            case 'select':
                inputElement = this.createSelectInput(input);
                break;
            case 'checkbox':
                inputElement = this.createCheckboxInput(input);
                break;
            default:
                inputElement = this.createNumberInput(input);
        }

        group.appendChild(inputElement);

        // Hint text
        if (input.hint) {
            const hint = document.createElement('small');
            hint.className = 'parameter-hint';
            hint.textContent = input.hint;
            group.appendChild(hint);
        }

        // Range display for range inputs
        if (input.type === 'range' && input.min !== undefined && input.max !== undefined) {
            const rangeDisplay = document.createElement('div');
            rangeDisplay.className = 'parameter-range-values';
            rangeDisplay.innerHTML = `<span>${input.min}</span><span>${input.max}</span>`;
            group.appendChild(rangeDisplay);
        }

        // Use default button
        if (input.default !== undefined && input.default !== null) {
            const useDefaultBtn = document.createElement('button');
            useDefaultBtn.type = 'button';
            useDefaultBtn.className = 'use-default-btn';
            useDefaultBtn.textContent = 'Use Default';
            useDefaultBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const field = document.getElementById(`param-${input.name}`);
                field.value = input.default;
                this.parameterValues[input.name] = input.default;
            });
            group.appendChild(useDefaultBtn);
        }

        return group;
    }

    /**
     * Create number input
     */
    createNumberInput(input) {
        const container = document.createElement('div');

        const inputElement = document.createElement('input');
        inputElement.type = 'number';
        inputElement.id = `param-${input.name}`;
        inputElement.className = 'parameter-input';
        inputElement.name = input.name;
        inputElement.required = input.required !== false;

        if (input.default !== undefined) {
            inputElement.value = input.default;
            this.parameterValues[input.name] = input.default;
        }

        if (input.min !== undefined) inputElement.min = input.min;
        if (input.max !== undefined) inputElement.max = input.max;
        if (input.step !== undefined) inputElement.step = input.step;

        inputElement.addEventListener('change', () => {
            this.parameterValues[input.name] = parseFloat(inputElement.value) || '';
        });

        inputElement.addEventListener('input', () => {
            this.parameterValues[input.name] = parseFloat(inputElement.value) || '';
        });

        container.appendChild(inputElement);
        return container;
    }

    /**
     * Create range input
     */
    createRangeInput(input) {
        const container = document.createElement('div');

        const inputElement = document.createElement('input');
        inputElement.type = 'range';
        inputElement.id = `param-${input.name}`;
        inputElement.className = 'parameter-input';
        inputElement.name = input.name;

        if (input.default !== undefined) {
            inputElement.value = input.default;
            this.parameterValues[input.name] = input.default;
        }
        if (input.min !== undefined) inputElement.min = input.min;
        if (input.max !== undefined) inputElement.max = input.max;
        if (input.step !== undefined) inputElement.step = input.step;

        inputElement.addEventListener('change', () => {
            this.parameterValues[input.name] = parseFloat(inputElement.value) || '';
        });

        inputElement.addEventListener('input', () => {
            this.parameterValues[input.name] = parseFloat(inputElement.value) || '';
        });

        container.appendChild(inputElement);
        return container;
    }

    /**
     * Create select input
     */
    createSelectInput(input) {
        const container = document.createElement('div');

        const selectElement = document.createElement('select');
        selectElement.id = `param-${input.name}`;
        selectElement.className = 'parameter-select';
        selectElement.name = input.name;
        selectElement.required = input.required !== false;

        // Add placeholder
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select an option...';
        selectElement.appendChild(placeholder);

        // Add options
        if (input.options && Array.isArray(input.options)) {
            input.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label || option.value;
                if (input.default === option.value) {
                    opt.selected = true;
                }
                selectElement.appendChild(opt);
            });
        }

        selectElement.addEventListener('change', () => {
            this.parameterValues[input.name] = selectElement.value;
        });

        if (input.default !== undefined) {
            selectElement.value = input.default;
            this.parameterValues[input.name] = input.default;
        }

        container.appendChild(selectElement);
        return container;
    }

    /**
     * Create checkbox input
     */
    createCheckboxInput(input) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = 'var(--spacing-md)';

        const checkboxElement = document.createElement('input');
        checkboxElement.type = 'checkbox';
        checkboxElement.id = `param-${input.name}`;
        checkboxElement.className = 'parameter-input';
        checkboxElement.name = input.name;

        if (input.default) {
            checkboxElement.checked = input.default;
            this.parameterValues[input.name] = input.default;
        }

        checkboxElement.addEventListener('change', () => {
            this.parameterValues[input.name] = checkboxElement.checked;
        });

        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = `param-${input.name}`;
        checkboxLabel.textContent = input.label || input.display_name || input.name;
        checkboxLabel.style.margin = '0';
        checkboxLabel.style.cursor = 'pointer';

        container.appendChild(checkboxElement);
        container.appendChild(checkboxLabel);
        return container;
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Validate form
        if (!this.selectedModel) {
            this.showError('Please select a model');
            return;
        }

        if (!this.currentTicker) {
            this.showError('Please select a stock ticker');
            return;
        }

        // Validate form fields
        const formData = new FormData(this.form);
        const invalidFields = [];

        for (const input of this.modelInputs) {
            const value = formData.get(input.name);
            if (input.required !== false && (!value && value !== '0' && value !== false)) {
                invalidFields.push(input.display_name || input.name);
            }

            // Validate numeric ranges
            if (input.type === 'number' || input.type === 'range') {
                const numValue = parseFloat(value);
                if (input.min !== undefined && numValue < input.min) {
                    invalidFields.push(`${input.display_name || input.name} must be >= ${input.min}`);
                }
                if (input.max !== undefined && numValue > input.max) {
                    invalidFields.push(`${input.display_name || input.name} must be <= ${input.max}`);
                }
            }
        }

        if (invalidFields.length > 0) {
            this.showError('Please fix the following issues:\n' + invalidFields.join('\n'));
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        this.hideError();

        try {
            // Calculate valuation
            const response = await fetch(`${this.API_BASE_URL}/valuation/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_id: this.selectedModel,
                    ticker: this.currentTicker,
                    parameters: Object.fromEntries(formData)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Valuation calculation failed');
            }

            const results = await response.json();

            // Emit valuation calculated event
            this.emitValuationCalculated(results);

        } catch (error) {
            console.error('Error calculating valuation:', error);
            this.showError('Valuation calculation failed: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        this.parametersContainer.innerHTML = '';
        this.hideError();
        this.renderFormFields();
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        const submitBtn = this.form.querySelector('.btn-calculate');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        submitBtn.disabled = isLoading;

        if (isLoading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.formError.textContent = message;
        this.formError.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.formError.classList.add('hidden');
    }

    /**
     * Emit valuation-calculated custom event
     */
    emitValuationCalculated(results) {
        const event = new CustomEvent('valuation-calculated', {
            detail: { results }
        });
        document.dispatchEvent(event);
    }
}

// Initialize component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.valuationForm = new ValuationForm();
});
