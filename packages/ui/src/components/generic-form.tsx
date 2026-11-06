import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '../lib/utils';
import type { FormFieldConfig } from '@/types/common';

interface GenericFormProps {
  fields: FormFieldConfig[];
  onSubmit: (data: any) => Promise<void> | void;
  defaultValues?: Record<string, any>;
  schema?: z.ZodSchema;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
  layout?: 'vertical' | 'horizontal';
  columns?: 1 | 2 | 3;
}

export const GenericForm = ({
  fields,
  onSubmit,
  defaultValues = {},
  schema,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  onCancel,
  loading = false,
  className,
  layout = 'vertical',
  columns = 1
}: GenericFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create dynamic schema if not provided
  const formSchema = schema || z.object(
    fields.reduce((acc, field) => {
      let fieldSchema: any = z.any();

      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Email inválido');
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.required) {
        fieldSchema = fieldSchema.min(1, `${field.label} é obrigatório`);
      } else {
        fieldSchema = fieldSchema.optional();
      }

      acc[field.name] = fieldSchema;
      return acc;
    }, {} as Record<string, any>)
  );

  const form = useForm<Record<string, any>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem className={cn(
            layout === 'horizontal' && 'grid grid-cols-4 items-center gap-4'
          )}>
            <FormLabel className={cn(
              layout === 'horizontal' && 'text-right'
            )}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <div className={cn(
              layout === 'horizontal' && 'col-span-3'
            )}>
              <FormControl>
                {(() => {
                  switch (field.type) {
                    case 'textarea':
                      return (
                        <Textarea
                          placeholder={field.placeholder}
                          disabled={field.disabled || loading}
                          rows={field.rows || 3}
                          {...formField}
                        />
                      );

                    case 'select':
                      return (
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value}
                          disabled={field.disabled || loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );

                    case 'checkbox':
                      return (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={formField.value}
                            onCheckedChange={formField.onChange}
                            disabled={field.disabled || loading}
                          />
                          {field.description && (
                            <label className="text-sm text-muted-foreground">
                              {field.description}
                            </label>
                          )}
                        </div>
                      );

                    case 'switch':
                      return (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formField.value}
                            onCheckedChange={formField.onChange}
                            disabled={field.disabled || loading}
                          />
                          {field.description && (
                            <label className="text-sm text-muted-foreground">
                              {field.description}
                            </label>
                          )}
                        </div>
                      );

                    case 'number':
                      return (
                        <Input
                          type="number"
                          placeholder={field.placeholder}
                          disabled={field.disabled || loading}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          {...formField}
                          onChange={(e) => formField.onChange(Number(e.target.value))}
                        />
                      );

                    case 'email':
                      return (
                        <Input
                          type="email"
                          placeholder={field.placeholder}
                          disabled={field.disabled || loading}
                          {...formField}
                        />
                      );

                    case 'password':
                      return (
                        <Input
                          type="password"
                          placeholder={field.placeholder}
                          disabled={field.disabled || loading}
                          {...formField}
                        />
                      );

                    case 'date':
                      return (
                        <Input
                          type="date"
                          disabled={field.disabled || loading}
                          {...formField}
                        />
                      );

                    case 'time':
                      return (
                        <Input
                          type="time"
                          disabled={field.disabled || loading}
                          {...formField}
                        />
                      );

                    default:
                      return (
                        <Input
                          type="text"
                          placeholder={field.placeholder}
                          disabled={field.disabled || loading}
                          {...formField}
                        />
                      );
                  }
                })()}
              </FormControl>
              {field.description && layout === 'vertical' && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    );
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className={cn('space-y-6', className)}
      >
        <div className={cn(
          'grid gap-6',
          columns > 1 && gridCols[columns]
        )}>
          {fields.map(renderField)}
        </div>

        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || loading}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};