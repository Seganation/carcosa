kurdianamono/
|-- .DS_Store
|-- .env.example
|-- .gitignore
|-- COOLIFY_SETUP.md
|-- COOLIFY-DEPLOYMENT.md
|-- courseManagement.md
|-- DOCKER_PERMISSIONS.md
|-- docker-compose.yml
|-- layout.sh
|-- package-lock.json
|-- package.json
|-- README.md
|-- setup.sh
|-- tasks.md
|-- technical.txt
|-- todo.md
|-- turbo.json
|-- .cursor/
|   |-- rules/
|   |   |-- api-architecture.mdc
|   |   |-- database-schema.mdc
|   |   |-- file-uploads.mdc
|   |   |-- frontend-components.mdc
|   |   |-- internationalization.mdc
|   |   |-- project-overview.mdc
|-- .git/
|-- .github/
|   |-- workflows/
|   |   |-- api.yml
|   |   |-- web.yml
|-- apps/
|   |-- api/
|   |   |-- .gitignore
|   |   |-- Dockerfile
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |   |-- logs/
|   |   |   |-- combined.log
|   |   |   |-- error.log
|   |   |   |-- exceptions.log
|   |   |-- src/
|   |   |   |-- index.ts
|   |   |   |-- config/
|   |   |   |   |-- index.ts
|   |   |   |-- controllers/
|   |   |   |   |-- admin.controller.ts
|   |   |   |   |-- article.controller.ts
|   |   |   |   |-- auth.controller.ts
|   |   |   |   |-- calendar.controller.ts
|   |   |   |   |-- chat.controller.ts
|   |   |   |   |-- club-content.controller.ts
|   |   |   |   |-- club.controller.ts
|   |   |   |   |-- contact.controller.ts
|   |   |   |   |-- course.controller.ts
|   |   |   |   |-- event.controller.ts
|   |   |   |   |-- feed.controller.ts
|   |   |   |   |-- forum.controller.ts
|   |   |   |   |-- heartbeat.controller.ts
|   |   |   |   |-- home.controller.ts
|   |   |   |   |-- leaderboard.controller.ts
|   |   |   |   |-- library.controller.ts
|   |   |   |   |-- notification.controller.ts
|   |   |   |   |-- quiz.controller.ts
|   |   |   |   |-- search.controller.ts
|   |   |   |   |-- tag.controller.ts
|   |   |   |   |-- user.controller.ts
|   |   |   |-- middlewares/
|   |   |   |   |-- asyncHandler.ts
|   |   |   |   |-- auth.middleware.ts
|   |   |   |   |-- errorHandler.ts
|   |   |   |   |-- notFoundHandler.ts
|   |   |   |   |-- role.middleware.ts
|   |   |   |   |-- validateRequest.ts
|   |   |   |-- routes/
|   |   |   |   |-- admin.routes.ts
|   |   |   |   |-- article.routes.ts
|   |   |   |   |-- assignment.routes.ts
|   |   |   |   |-- auth.routes.ts
|   |   |   |   |-- calendar.routes.ts
|   |   |   |   |-- chat.routes.ts
|   |   |   |   |-- club-content.routes.ts
|   |   |   |   |-- clubs.routes.ts
|   |   |   |   |-- contact.routes.ts
|   |   |   |   |-- course.routes.ts
|   |   |   |   |-- event.routes.ts
|   |   |   |   |-- feed.routes.ts
|   |   |   |   |-- forum.routes.ts
|   |   |   |   |-- heartbeat.routes.ts
|   |   |   |   |-- home.routes.ts
|   |   |   |   |-- index.ts
|   |   |   |   |-- leaderboard.routes.ts
|   |   |   |   |-- library.routes.ts
|   |   |   |   |-- notification.routes.ts
|   |   |   |   |-- quiz.routes.ts
|   |   |   |   |-- search.routes.ts
|   |   |   |   |-- tags.routes.ts
|   |   |   |   |-- university.routes.ts
|   |   |   |   |-- user.routes.ts
|   |   |   |-- services/
|   |   |   |   |-- admin.service.ts
|   |   |   |   |-- article.service.ts
|   |   |   |   |-- auth.service.ts
|   |   |   |   |-- calendar.service.ts
|   |   |   |   |-- chat.service.ts
|   |   |   |   |-- cleanup.service.ts
|   |   |   |   |-- club-content.service.ts
|   |   |   |   |-- club.service.ts
|   |   |   |   |-- course.service.ts
|   |   |   |   |-- email.service.ts
|   |   |   |   |-- event.service.ts
|   |   |   |   |-- feed.service.ts
|   |   |   |   |-- forum.service.ts
|   |   |   |   |-- heartbeat.service.ts
|   |   |   |   |-- home.service.ts
|   |   |   |   |-- leaderboard.service.ts
|   |   |   |   |-- library.service.ts
|   |   |   |   |-- notification.service.ts
|   |   |   |   |-- quiz.service.ts
|   |   |   |   |-- search.service.ts
|   |   |   |   |-- tag.service.ts
|   |   |   |   |-- user.service.ts
|   |   |   |-- sockets/
|   |   |   |   |-- index.ts
|   |   |   |-- utils/
|   |   |   |   |-- ApiError.ts
|   |   |   |   |-- contentParsers.ts
|   |   |   |   |-- cron.ts
|   |   |   |   |-- cronJobs.ts
|   |   |   |   |-- logger.ts
|   |   |   |   |-- socketServer.ts
|   |   |   |   |-- stringUtils.ts
|   |   |   |-- validations/
|   |   |   |   |-- article.validation.ts
|   |   |   |   |-- auth.validation.ts
|   |   |   |   |-- contact.validation.ts
|   |   |   |   |-- forum.validation.ts
|   |   |   |   |-- library.validation.ts
|   |   |   |   |-- quiz.validation.ts
|   |-- web/
|   |   |-- .eslintrc.js
|   |   |-- .gitignore
|   |   |-- components.json
|   |   |-- Dockerfile
|   |   |-- i18n.ts
|   |   |-- middleware.ts
|   |   |-- next-env.d.ts
|   |   |-- next-i18next.config.js
|   |   |-- next.config.js
|   |   |-- package.json
|   |   |-- postcss.config.js
|   |   |-- README.md
|   |   |-- tailwind.config.js
|   |   |-- tsconfig.json
|   |   |-- tsconfig.tsbuildinfo
|   |   |-- app/
|   |   |   |-- auth-provider.tsx
|   |   |   |-- favicon.ico
|   |   |   |-- globals.css
|   |   |   |-- i18n-client.ts
|   |   |   |-- layout.tsx
|   |   |   |-- providers.tsx
|   |   |   |-- (auth)/
|   |   |   |   |-- layout.tsx
|   |   |   |   |-- auth/
|   |   |   |   |   |-- error/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- forgot-password/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- login/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- pending-approval/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- register/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- reset-password/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |-- (main)/
|   |   |   |   |-- layout.tsx
|   |   |   |   |-- page.tsx
|   |   |   |   |-- about/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- articles/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- [slug]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- publish/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- new/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- assignments/
|   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- calendar/
|   |   |   |   |   |-- calendar.css
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- clubs/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- [slug]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- components/
|   |   |   |   |   |   |   |-- club-announcements.tsx
|   |   |   |   |   |   |   |-- club-discussions.tsx
|   |   |   |   |   |   |   |-- club-header.tsx
|   |   |   |   |   |   |   |-- club-members.tsx
|   |   |   |   |   |   |   |-- club-resources.tsx
|   |   |   |   |   |   |-- discussions/
|   |   |   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |   |-- components/
|   |   |   |   |   |   |   |   |-- reply-form.tsx
|   |   |   |   |   |   |-- edit/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- components/
|   |   |   |   |   |   |-- client-pagination.tsx
|   |   |   |   |   |   |-- club-card.tsx
|   |   |   |   |   |   |-- club-gallery.tsx
|   |   |   |   |   |   |-- clubs-filter.tsx
|   |   |   |   |   |   |-- clubs-header.tsx
|   |   |   |   |   |-- create/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- community-guidelines/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- components/
|   |   |   |   |   |-- rich-text-editor/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- contact/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- courses/
|   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- discover/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- events/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- edit/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- create/
|   |   |   |   |   |   |-- map-component.tsx
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- faq/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- feed/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- bookmarks/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- hashtags/
|   |   |   |   |   |   |-- [tag]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- posts/
|   |   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- forum/
|   |   |   |   |   |-- layout.tsx
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- categories/
|   |   |   |   |   |   |-- [slug]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- questions/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- [slug]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- new/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- help-center/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- leaderboard/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- components/
|   |   |   |   |   |   |-- major-leaderboard.tsx
|   |   |   |   |   |   |-- student-leaderboard.tsx
|   |   |   |   |   |   |-- university-leaderboard.tsx
|   |   |   |   |-- library/
|   |   |   |   |   |-- actions.ts
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- translation-components.tsx
|   |   |   |   |   |   |-- edit/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- add/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- components/
|   |   |   |   |   |   |-- book-card.tsx
|   |   |   |   |   |   |-- book-filter-sidebar.tsx
|   |   |   |   |   |   |-- book-form.tsx
|   |   |   |   |   |   |-- book-list.tsx
|   |   |   |   |   |   |-- book-search-bar.tsx
|   |   |   |   |   |   |-- pagination-controls.tsx
|   |   |   |   |   |   |-- translation-components.tsx
|   |   |   |   |-- major-management/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- assignments/
|   |   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |   |-- create/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- courses/
|   |   |   |   |   |   |-- [courseId]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- messages/
|   |   |   |   |   |-- layout.tsx
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- notifications/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- privacy-policy/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- profile/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- components/
|   |   |   |   |   |   |-- AcademicInfoForm.tsx
|   |   |   |   |   |   |-- ProfileAbout.tsx
|   |   |   |   |   |   |-- ProfileCover.tsx
|   |   |   |   |   |   |-- ProfileEditForm.tsx
|   |   |   |   |   |   |-- ProfileFriends.tsx
|   |   |   |   |   |   |-- ProfileHeader.tsx
|   |   |   |   |   |   |-- ProfileInfoBar.tsx
|   |   |   |   |   |   |-- ProfileNavigation.tsx
|   |   |   |   |   |   |-- ProfileStats.tsx
|   |   |   |   |   |   |-- UserPostsFeed.tsx
|   |   |   |   |-- quizzes/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- [slug]/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- attempt/
|   |   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- create/
|   |   |   |   |   |   |-- page.tsx
|   |   |   |   |   |-- results/
|   |   |   |   |   |   |-- [id]/
|   |   |   |   |   |   |   |-- page.tsx
|   |   |   |   |-- search/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- settings/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- terms-of-service/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- university-management/
|   |   |   |   |   |-- page.tsx
|   |   |   |-- admin/
|   |   |   |   |-- layout.tsx
|   |   |   |   |-- page.tsx
|   |   |   |   |-- book-categories/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- books/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- dashboard/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- forums/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- registrations/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- representatives/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- tags/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- universities/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |-- users/
|   |   |   |   |   |-- page.tsx
|   |   |   |-- api/
|   |   |   |   |-- auth/
|   |   |   |   |   |-- [...nextauth]/
|   |   |   |   |   |   |-- route.ts
|   |   |   |   |   |-- token/
|   |   |   |   |   |   |-- route.ts
|   |   |   |   |-- health/
|   |   |   |   |   |-- route.ts
|   |   |   |   |-- uploadthing/
|   |   |   |   |   |-- core.ts
|   |   |   |   |   |-- route.ts
|   |   |   |-- hooks/
|   |   |   |   |-- useDirection.ts
|   |   |   |   |-- useTranslation.ts
|   |   |-- components/
|   |   |   |-- LanguageSwitcher.tsx
|   |   |   |-- auth/
|   |   |   |   |-- RouteGuard.tsx
|   |   |   |-- chat/
|   |   |   |   |-- ChatList.tsx
|   |   |   |   |-- ChatMessage.tsx
|   |   |   |   |-- ChatPanel.tsx
|   |   |   |   |-- MessageInput.tsx
|   |   |   |   |-- NewChatDialog.tsx
|   |   |   |-- feed/
|   |   |   |   |-- FeedPost.tsx
|   |   |   |   |-- PostComposer.tsx
|   |   |   |   |-- TrendingHashtags.tsx
|   |   |   |   |-- UserToFollow.tsx
|   |   |   |-- layout/
|   |   |   |   |-- AppLayout.tsx
|   |   |   |   |-- BottomNav.tsx
|   |   |   |   |-- Footer.tsx
|   |   |   |   |-- Header.tsx
|   |   |   |   |-- index.tsx
|   |   |   |   |-- MainLayout.tsx
|   |   |   |   |-- MobileNav.tsx
|   |   |   |   |-- Sidebar.tsx
|   |   |   |-- notifications/
|   |   |   |   |-- NotificationBadge.tsx
|   |   |   |   |-- NotificationList.tsx
|   |   |   |   |-- NotificationPage.tsx
|   |   |   |-- profile/
|   |   |   |   |-- index.ts
|   |   |   |   |-- ProfileHoverCard.tsx
|   |   |   |-- quizzes/
|   |   |   |   |-- QuizAttempt.tsx
|   |   |   |   |-- QuizCard.tsx
|   |   |   |   |-- QuizDetails.tsx
|   |   |   |   |-- QuizFilters.tsx
|   |   |   |   |-- QuizForm.tsx
|   |   |   |   |-- QuizResults.tsx
|   |   |   |   |-- QuizStart.tsx
|   |   |   |-- search/
|   |   |   |   |-- SearchDropdown.tsx
|   |   |   |-- ui/
|   |   |   |   |-- accordion.tsx
|   |   |   |   |-- alert-dialog.tsx
|   |   |   |   |-- alert.tsx
|   |   |   |   |-- avatar.tsx
|   |   |   |   |-- badge.tsx
|   |   |   |   |-- button.tsx
|   |   |   |   |-- calendar.tsx
|   |   |   |   |-- card.tsx
|   |   |   |   |-- checkbox.tsx
|   |   |   |   |-- collapsible.tsx
|   |   |   |   |-- command.tsx
|   |   |   |   |-- date-time-picker.tsx
|   |   |   |   |-- dialog.tsx
|   |   |   |   |-- dropdown-menu.tsx
|   |   |   |   |-- form.tsx
|   |   |   |   |-- hover-card.tsx
|   |   |   |   |-- input.tsx
|   |   |   |   |-- label.tsx
|   |   |   |   |-- multi-select.tsx
|   |   |   |   |-- pagination.tsx
|   |   |   |   |-- popover.tsx
|   |   |   |   |-- progress.tsx
|   |   |   |   |-- radio-group.tsx
|   |   |   |   |-- rich-text-editor.tsx
|   |   |   |   |-- scroll-area.tsx
|   |   |   |   |-- select.tsx
|   |   |   |   |-- separator.tsx
|   |   |   |   |-- sheet.tsx
|   |   |   |   |-- skeleton.tsx
|   |   |   |   |-- spinner.tsx
|   |   |   |   |-- switch.tsx
|   |   |   |   |-- table.tsx
|   |   |   |   |-- tabs.tsx
|   |   |   |   |-- textarea.tsx
|   |   |   |   |-- toggle-group.tsx
|   |   |   |   |-- toggle.tsx
|   |   |   |   |-- tooltip.tsx
|   |   |   |   |-- rich-text-editor/
|   |   |   |   |   |-- index.ts
|   |   |-- contexts/
|   |   |   |-- NotificationContext.tsx
|   |   |   |-- SocketContext.tsx
|   |   |-- hooks/
|   |   |   |-- useAuth.ts
|   |   |   |-- useHeartbeat.ts
|   |   |   |-- useHome.ts
|   |   |   |-- useOnlineCount.ts
|   |   |   |-- useQuickSearch.ts
|   |   |   |-- useSearch.ts
|   |   |   |-- useSocketEvents.ts
|   |   |-- lib/
|   |   |   |-- api.ts
|   |   |   |-- auth-options.ts
|   |   |   |-- themes.ts
|   |   |   |-- utils.ts
|   |   |-- public/
|   |   |   |-- images/
|   |   |   |   |-- banner-dark.png
|   |   |   |   |-- banner-light.png
|   |   |   |   |-- default-avatar.png
|   |   |   |   |-- default-avatar.svg
|   |   |   |   |-- kurdiana-illustration.svg
|   |   |   |   |-- logo.png
|   |   |   |   |-- badges/
|   |   |   |   |   |-- bug-hunter.png
|   |   |   |   |   |-- cs-expert.png
|   |   |   |   |   |-- event-organizer.png
|   |   |   |   |   |-- first-following.png
|   |   |   |   |   |-- first-question.png
|   |   |   |   |   |-- helpful-hand.png
|   |   |   |   |   |-- hmmm-a-writer.png
|   |   |   |   |   |-- joined-a-club.png
|   |   |   |   |   |-- platform-pioneer.png
|   |   |   |   |   |-- top-contributer.png
|   |   |   |   |   |-- university-ambassador.png
|   |   |   |   |-- leaflet/
|   |   |   |   |   |-- marker-icon-2x.png
|   |   |   |   |   |-- marker-shadow.png
|   |   |   |-- locales/
|   |   |   |   |-- ar/
|   |   |   |   |   |-- auth.json
|   |   |   |   |   |-- common.json
|   |   |   |   |   |-- library.json
|   |   |   |   |   |-- navigation.json
|   |   |   |   |-- en/
|   |   |   |   |   |-- auth.json
|   |   |   |   |   |-- common.json
|   |   |   |   |   |-- library.json
|   |   |   |   |   |-- navigation.json
|   |   |   |   |-- ku/
|   |   |   |   |   |-- auth.json
|   |   |   |   |   |-- common.json
|   |   |   |   |   |-- library.json
|   |   |   |   |   |-- navigation.json
|   |   |-- types/
|   |   |   |-- next-auth.d.ts
|   |   |   |-- react-leaflet.d.ts
|   |   |-- utils/
|   |   |   |-- cn.ts
|   |   |   |-- uploadthing.ts
|-- docs/
|   |-- EMAIL_SETUP.md
|-- packages/
|   |-- config-eslint/
|   |   |-- library.js
|   |   |-- next.js
|   |   |-- package.json
|   |   |-- README.md
|   |-- config-typescript/
|   |   |-- base.json
|   |   |-- nextjs.json
|   |   |-- package.json
|   |-- database/
|   |   |-- .eslintrc.js
|   |   |-- .gitignore
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |   |-- tsup.config.ts
|   |   |-- dist/
|   |   |   |-- book.js
|   |   |   |-- book.js.map
|   |   |   |-- book.mjs
|   |   |   |-- book.mjs.map
|   |   |   |-- chunk-3IIFBJCD.mjs
|   |   |   |-- chunk-3IIFBJCD.mjs.map
|   |   |   |-- chunk-JZM4Z726.mjs
|   |   |   |-- chunk-JZM4Z726.mjs.map
|   |   |   |-- client.js
|   |   |   |-- client.js.map
|   |   |   |-- client.mjs
|   |   |   |-- client.mjs.map
|   |   |   |-- seed.js
|   |   |   |-- seed.js.map
|   |   |   |-- seed.mjs
|   |   |   |-- seed.mjs.map
|   |   |-- prisma/
|   |   |   |-- schema.prisma
|   |   |   |-- migrations/
|   |   |   |   |-- migration_lock.toml
|   |   |   |   |-- 20250429085721_init/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250501102726_added_forums/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250501155818_added_leaderboards/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250501171220_added_library/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250502101514_added_events/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250502130817_add_event_visibility/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250504093433_added_clubs/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250504120739_added_quizzes/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250505084237_added_chats_and_feed_models/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250510212611_added_notifications/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250530194117_added_course_managmenet/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250710081020_add_user_last_active/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250713082809_add_major_rep_semister/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250713084059_change_semester_enum/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250713102858_add_token_blacklist/
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20250717083032_add_user_cover_image/
|   |   |   |   |   |-- migration.sql
|   |   |-- src/
|   |   |   |-- book.json
|   |   |   |-- client.ts
|   |   |   |-- seed.ts
