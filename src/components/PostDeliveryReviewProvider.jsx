import PostDeliveryReviewModal from '../features/products/PostDeliveryReviewModal';
import usePostDeliveryReviewPrompt from '../hooks/usePostDeliveryReviewPrompt';

export default function PostDeliveryReviewProvider({ children }) {
  const { prompt, modalOpen, closeModal, updatePrompt } = usePostDeliveryReviewPrompt();

  return (
    <>
      {children}
      <PostDeliveryReviewModal
        open={modalOpen && Boolean(prompt)}
        prompt={prompt}
        onClose={closeModal}
        onPromptUpdate={updatePrompt}
      />
    </>
  );
}
