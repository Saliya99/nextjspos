import { forwardRef } from 'react'
import { FieldError } from 'react-hook-form'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  required?: boolean
  isValid?: boolean
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required, isValid, className = '', id, ...props }, ref) => {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${fieldId}-error`
    const hasValue = props.value && String(props.value).length > 0
    const showValidIcon = hasValue && !error && isValid
    
    return (
      <div>
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            aria-required={required}
            className={`input w-full pr-10 ${
              error ? 'border-red-500 focus:border-red-500' : 
              showValidIcon ? 'border-green-500 focus:border-green-500' : ''
            } ${className}`}
            {...props}
          />
          {error && (
            <ExclamationCircleIcon 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" 
              aria-hidden="true"
            />
          )}
          {showValidIcon && (
            <CheckCircleIcon 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" 
              aria-hidden="true"
            />
          )}
        </div>
        {error && (
          <p id={errorId} className="text-red-500 text-sm mt-1 flex items-center" role="alert">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
            {error.message}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField