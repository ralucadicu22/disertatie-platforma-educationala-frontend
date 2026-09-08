import { motion } from 'framer-motion';
import { Trash2, Edit2, CheckCheck } from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../../design-system/components';
import { getFeedbackTag, RATING_STARS } from '../../utils/feedbackHelpers';
import { timeAgo } from '../../utils/formatters';
import { cn } from '../../design-system/cn';

const FeedbackCard = ({
                          feedback,
                          perspective = 'student',
                          onDelete,
                          onMarkRead,
                          index = 0,
                      }) => {
    const tag = feedback.tag ? getFeedbackTag(feedback.tag) : null;
    const isUnread = !feedback.readByStudent;
    const isStudentPerspective = perspective === 'student';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
        >
            <Card
                padding="md"
                className={cn(
                    'transition-all',
                    isStudentPerspective && isUnread && 'border-primary-200 bg-primary-50/30'
                )}
            >

                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                            name={isStudentPerspective ? feedback.teacherName : feedback.studentName}
                            size="md"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-body font-semibold text-neutral-900">
                                    {isStudentPerspective ? feedback.teacherName : feedback.studentName}
                                </span>
                                {isStudentPerspective && isUnread && (
                                    <Badge variant="primary" size="sm" dot>Nou</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {feedback.classroomName && (
                                    <span className="text-caption text-neutral-500">
                                        {feedback.classroomName}
                                    </span>
                                )}
                                <span className="text-caption text-neutral-400">
                                    {timeAgo(feedback.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {feedback.rating && (
                            <span className="text-warning-500 text-body">
                                {'★'.repeat(feedback.rating)}
                                <span className="text-neutral-200">
                                    {'★'.repeat(5 - feedback.rating)}
                                </span>
                            </span>
                        )}
                        {tag && (
                            <Badge variant={tag.color} size="sm">
                                {tag.emoji} {tag.label}
                            </Badge>
                        )}
                    </div>
                </div>

                <p className="text-body text-neutral-800 leading-relaxed whitespace-pre-wrap">
                    {feedback.message}
                </p>

                {(onDelete || onMarkRead) && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-neutral-100">
                        {isStudentPerspective && isUnread && onMarkRead && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={CheckCheck}
                                onClick={() => onMarkRead(feedback.id)}
                                className="text-primary-600"
                            >
                                Marcheaza ca citit
                            </Button>
                        )}
                        {!isStudentPerspective && onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Trash2}
                                onClick={() => onDelete(feedback.id)}
                                className="text-danger-600 hover:bg-danger-50"
                            />
                        )}
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

export default FeedbackCard;