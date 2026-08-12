import type { z } from 'zod';
import type {
  createCategorySchema,
  getAllCategoriesSchema,
  getCategoryByIdSchema,
  updateCategorySchema,
  deleteCategorySchema,
} from '../validations/category.validation';

export type CreateCategoryRequest = z.infer<typeof createCategorySchema>['body'];
export type GetAllCategoryQuery = z.infer<typeof getAllCategoriesSchema>['query'];
export type GetCategoryByIdParams = z.infer<typeof getCategoryByIdSchema>['params'];
export type UpdateCategoryParams = z.infer<typeof updateCategorySchema>['params'];
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>['body'];
export type DeleteCategoryParams = z.infer<typeof deleteCategorySchema>['params'];
