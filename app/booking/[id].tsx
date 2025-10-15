import { ReviewModal } from '@/components/ReviewModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useAcceptBooking,
  useBooking,
  useCancelBooking,
  useCompleteBooking,
  useMarkOnTheWay,
  useRejectBooking,
  useStartService,
} from '@/hooks/useBookings';
import { useCreateReview } from '@/hooks/useReviews';
import { BookingStatus } from '@/types';
import { showFailedMessage, showSuccessMessage, showWarningMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: booking, isLoading } = useBooking(id as string);
  const cancelBookingMutation = useCancelBooking();
  const acceptBookingMutation = useAcceptBooking();
  const rejectBookingMutation = useRejectBooking();
  const markOnTheWayMutation = useMarkOnTheWay();
  const startServiceMutation = useStartService();
  const completeBookingMutation = useCompleteBooking();
  const createReviewMutation = useCreateReview();

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      showWarningMessage('Required', 'Please provide a reason for cancellation');
      return;
    }

    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: id as string,
        reason: cancelReason,
      });
      setShowCancelModal(false);
      showSuccessMessage('Success', 'Booking cancelled successfully');
    } catch (error) {
      showFailedMessage('Error', 'Failed to cancel booking');
    }
  };

  const handleAcceptBooking = async () => {
    try {
      await acceptBookingMutation.mutateAsync(id as string);
      showSuccessMessage('Success', 'Booking accepted successfully');
    } catch (error) {
      showFailedMessage('Error', 'Failed to accept booking');
    }
  };

  const handleRejectBooking = async () => {
    if (!rejectReason.trim()) {
      showWarningMessage('Required', 'Please provide a reason for rejection');
      return;
    }

    try {
      await rejectBookingMutation.mutateAsync({
        bookingId: id as string,
        reason: rejectReason,
      });
      setShowRejectModal(false);
      showSuccessMessage('Success', 'Booking rejected');
    } catch (error) {
      showFailedMessage('Error', 'Failed to reject booking');
    }
  };

  const handleMarkOnTheWay = async () => {
    try {
      await markOnTheWayMutation.mutateAsync(id as string);
      showSuccessMessage('Success', 'Marked as on the way');
    } catch (error) {
      showFailedMessage('Error', 'Failed to update status');
    }
  };

  const handleStartService = async () => {
    try {
      await startServiceMutation.mutateAsync(id as string);
      showSuccessMessage('Success', 'Service started');
    } catch (error) {
      showFailedMessage('Error', 'Failed to start service');
    }
  };

  const handleCompleteService = async () => {
    setShowCompleteModal(true);
  };

  const confirmCompleteService = async () => {
    try {
      await completeBookingMutation.mutateAsync({ bookingId: id as string });
      setShowCompleteModal(false);
      showSuccessMessage('Success', 'Service marked as completed');
    } catch (error) {
      setShowCompleteModal(false);
      showFailedMessage('Error', 'Failed to complete service');
    }
  };

  const handleSubmitReview = async (rating: number, comment: string, images: string[]) => {
    if (!booking) return;

    try {
      // TODO: Upload images to Firebase Storage and get URLs
      // For now, we'll pass the images array as-is
      await createReviewMutation.mutateAsync({
        providerId: booking.providerId,
        bookingId: booking.id,
        rating,
        comment,
        serviceId: booking.serviceId,
        images: images || [],
      });

      setShowReviewModal(false);
      showSuccessMessage('Review Submitted', 'Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting review:', error);
      showFailedMessage('Error', 'Failed to submit review. Please try again.');
    }
  };

  const handleCall = (phone: string) => {
    if (!phone || phone.trim() === '') {
      showWarningMessage('No Phone Number', 'Phone number not available for this user');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
      case 'confirmed':
        return colors.success;
      case 'on-the-way':
        return '#2196F3';
      case 'in-progress':
        return '#9C27B0';
      case 'completed':
        return colors.success;
      case 'cancelled':
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending Confirmation';
      case 'accepted':
        return 'Accepted';
      case 'confirmed':
        return 'Confirmed';
      case 'on-the-way':
        return 'Professional On The Way';
      case 'in-progress':
        return 'Service In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isCustomer = user?.uid === booking?.customerId;
  const isProvider = user?.uid === booking?.providerId;

  if (isLoading) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            Loading booking details...
          </Text>
        </View>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text className="mt-4 text-xl font-bold text-center" style={{ color: colors.text }}>
            Booking Not Found
          </Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" className="mt-6" />
        </View>
      </Container>
    );
  }

  const dateObj = new Date(booking.scheduledDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = booking.scheduledTime;
  const formattedSlot = booking.scheduledSlot;

  return (
    <Container safeArea edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 }}>
          Booking Details
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Status Card */}
          <Card
            variant="elevated"
            style={{
              marginBottom: 20,
              padding: 24,
              alignItems: 'center',
              backgroundColor: colors.background,
              borderWidth: 2,
              borderColor: getStatusColor(booking.status),
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: getStatusColor(booking.status),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={
                  booking.status === 'completed'
                    ? 'checkmark-circle'
                    : booking.status === 'cancelled' || booking.status === 'rejected'
                    ? 'close-circle'
                    : booking.status === 'in-progress'
                    ? 'construct'
                    : 'time'
                }
                size={32}
                color="white"
              />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              {getStatusText(booking.status)}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              Booking ID: #{booking.id.slice(0, 8)}
            </Text>
          </Card>

          {/* Service Details */}
          <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
              Service Details
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Service</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {booking.serviceName}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Date</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {formattedDate}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Time</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {formattedTime}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Time Slot</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {formattedSlot}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Total Amount</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                ₹{booking.price}
              </Text>
            </View>
          </Card>

          {/* Customer/Provider Info */}
          <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
              {isCustomer ? 'Professional' : 'Customer'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {(isCustomer ? booking.providerPhoto : booking.customerPhoto) ? (
                <Image
                  source={{ uri: isCustomer ? booking.providerPhoto : booking.customerPhoto }}
                  style={{ width: 56, height: 56, borderRadius: 28, marginRight: 16 }}
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
                    {getInitials(isCustomer ? booking.providerName : booking.customerName)}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                  {isCustomer ? booking.providerName : booking.customerName}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {isCustomer ? booking.providerPhone : booking.customerPhone}
                </Text>
              </View>
              <Pressable
                onPress={() => handleCall(isCustomer ? booking.providerPhone : booking.customerPhone)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="active:opacity-70"
              >
                <Ionicons name="call" size={20} color="white" />
              </Pressable>
            </View>
          </Card>

          {/* Address */}
          <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
              Service Location
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="location" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, marginLeft: 12, lineHeight: 20 }}>
                {booking.address.street}
                {booking.address.apartment ? `, ${booking.address.apartment}` : ''}
                {'\n'}
                {booking.address.landmark ? `${booking.address.landmark}, ` : ''}
                {booking.address.city}, {booking.address.state} - {booking.address.pincode}
              </Text>
            </View>
          </Card>

          {/* Special Instructions */}
          {booking.notes && (
            <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                Special Instructions
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                {booking.notes}
              </Text>
            </Card>
          )}

          {/* Cancellation/Rejection Reason */}
          {(booking.status === 'cancelled' || booking.status === 'rejected') &&
            booking.cancellationReason && (
              <Card
                variant="default"
                style={{
                  marginBottom: 16,
                  padding: 20,
                  backgroundColor: `${colors.error}10`,
                  borderColor: colors.error,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                  {booking.status === 'cancelled' ? 'Cancellation' : 'Rejection'} Reason
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                  {booking.cancellationReason}
                </Text>
              </Card>
            )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {(booking.status !== 'completed' &&
        booking.status !== 'cancelled' &&
        booking.status !== 'rejected') ||
      (isCustomer && booking.status === 'completed') ? (
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          {/* Customer Actions */}
          {isCustomer && (
            <View style={{ gap: 12 }}>
              {(booking.status === 'pending' || booking.status === 'accepted') && (
                <Button
                  title="Cancel Booking"
                  variant="outline"
                  onPress={() => setShowCancelModal(true)}
                  icon="close-circle"
                />
              )}
              {booking.status === 'completed' && (
                <Button
                  title="Rate & Review"
                  onPress={() => setShowReviewModal(true)}
                  icon="star"
                />
              )}
            </View>
          )}

          {/* Provider Actions */}
          {isProvider && booking.status !== 'completed' && (
            <View style={{ gap: 12 }}>
              {booking.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Reject"
                      variant="outline"
                      onPress={() => setShowRejectModal(true)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Accept" onPress={handleAcceptBooking} />
                  </View>
                </View>
              )}
              {booking.status === 'accepted' && (
                <Button title="Mark On The Way" onPress={handleMarkOnTheWay} icon="car" />
              )}
              {booking.status === 'on-the-way' && (
                <Button title="Start Service" onPress={handleStartService} icon="construct" />
              )}
              {booking.status === 'in-progress' && (
                <Button
                  title="Complete Service"
                  onPress={handleCompleteService}
                  icon="checkmark-circle"
                />
              )}
            </View>
          )}
        </View>
      ) : null}

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Card variant="elevated" style={{ padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Cancel Booking
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
              Please provide a reason for cancellation:
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                backgroundColor: colors.background,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="Reason for cancellation..."
              placeholderTextColor={colors.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Close"
                  variant="outline"
                  onPress={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Cancel Booking" onPress={handleCancelBooking} />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Card variant="elevated" style={{ padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Reject Booking
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
              Please provide a reason for rejection:
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                backgroundColor: colors.background,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.textSecondary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Close"
                  variant="outline"
                  onPress={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Reject" onPress={handleRejectBooking} />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Complete Service Modal */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Card variant="elevated" style={{ padding: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' }}>
              Complete Service
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
              Mark this service as completed? This action will notify the customer.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowCompleteModal(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button 
                  title="Complete" 
                  onPress={confirmCompleteService}
                  loading={completeBookingMutation.isPending}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
      />
    </Container>
  );
}

