/**
 * Lazy-loaded components for code splitting
 * These components are loaded only when needed to reduce initial bundle size
 */

import { lazy } from 'react';

// Dashboard Components
export const LazyEntityGrid = lazy(() => import('../entities/EntityGrid').then(module => ({ default: module.EntityGrid })));
export const LazyTemplateGrid = lazy(() => import('../templates/TemplateGrid').then(module => ({ default: module.TemplateGrid })));
export const LazyFolderGrid = lazy(() => import('../folders/FolderGrid').then(module => ({ default: module.FolderGrid })));

// Relationship Components  
export const LazyRelationshipGraph = lazy(() => import('../relationships/RelationshipGraph').then(module => ({ default: module.RelationshipGraph })));
export const LazyRelationshipTable = lazy(() => import('../relationships/RelationshipTable').then(module => ({ default: module.RelationshipTable })));

// Modal Components
export const LazyEntityDetailModal = lazy(() => import('../entities/EntityDetailModal').then(module => ({ default: module.EntityDetailModal })));
export const LazyCreateTemplateModal = lazy(() => import('../templates/CreateTemplateModal').then(module => ({ default: module.CreateTemplateModal })));
export const LazyCreateFolderModal = lazy(() => import('../folders/CreateFolderModal').then(module => ({ default: module.CreateFolderModal })));
export const LazyCreateRelationshipModal = lazy(() => import('../relationships/CreateRelationshipModal').then(module => ({ default: module.CreateRelationshipModal })));
export const LazyEditFolderModal = lazy(() => import('../folders/EditFolderModal').then(module => ({ default: module.EditFolderModal })));

// Membership
export const LazyMembershipTab = lazy(() => import('../membership/MembershipTab').then(module => ({ default: module.MembershipTab })));

// Loading fallback components
export { LazyComponentLoader } from './LazyComponentLoader';
export { SkeletonLoader, type SkeletonType } from './SkeletonLoader';

// Skeleton components
export { EntityCardSkeleton, EntityGridSkeleton } from '../entities/EntityCardSkeleton';
export { WorldCardSkeleton, WorldGridSkeleton } from '../worlds/WorldCardSkeleton'; 
export { TemplateCardSkeleton, TemplateGridSkeleton } from '../templates/TemplateCardSkeleton';
export { FolderCardSkeleton, FolderGridSkeleton } from '../folders/FolderCardSkeleton';