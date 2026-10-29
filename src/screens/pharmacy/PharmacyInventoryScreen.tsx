import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing } from '../../theme/colors';
import Card from '../../components/Card';
import { PharmacyProduct, ProductCategory } from '../../types';

export default function PharmacyInventoryScreen() {
  const navigation = useNavigation();
  const { inventory, addProduct, updateProduct, deleteProduct, restockProduct } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Restock Modal
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<PharmacyProduct | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState('50');

  // Add / Edit Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyProduct | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [formula, setFormula] = useState('');
  const [category, setCategory] = useState<ProductCategory>('tablets');
  const [price, setPrice] = useState('150');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [lowStockAlert, setLowStockAlert] = useState('20');
  const [rxRequired, setRxRequired] = useState(true);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'tablets', label: 'Tablets' },
    { id: 'syrup', label: 'Syrups' },
    { id: 'injection', label: 'Injections' },
    { id: 'needle', label: 'Needles' },
    { id: 'sanitary', label: 'Sanitary' },
    { id: 'pen', label: 'Insulin Pens' },
    { id: 'equipment', label: 'Equipment' },
  ];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.formula.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ? true : item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.stockQuantity <= item.lowStockAlert);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setBrand('');
    setFormula('');
    setCategory('tablets');
    setPrice('100');
    setStockQuantity('50');
    setLowStockAlert('15');
    setRxRequired(true);
    setAddModalVisible(true);
  };

  const openEditModal = (item: PharmacyProduct) => {
    setEditingItem(item);
    setName(item.name);
    setBrand(item.brand);
    setFormula(item.formula);
    setCategory(item.category);
    setPrice(String(item.price));
    setStockQuantity(String(item.stockQuantity));
    setLowStockAlert(String(item.lowStockAlert));
    setRxRequired(item.prescriptionRequired);
    setAddModalVisible(true);
  };

  const handleSaveProduct = () => {
    if (!name.trim()) {
      return;
    }

    if (editingItem) {
      updateProduct(editingItem.id, {
        name,
        brand,
        formula,
        category,
        price: parseFloat(price) || 50,
        stockQuantity: parseInt(stockQuantity, 10) || 10,
        lowStockAlert: parseInt(lowStockAlert, 10) || 5,
        prescriptionRequired: rxRequired,
      });
    } else {
      addProduct({
        name,
        brand: brand || 'Generic Pharma',
        formula: formula || 'Standard Composition',
        category,
        price: parseFloat(price) || 50,
        stockQuantity: parseInt(stockQuantity, 10) || 50,
        lowStockAlert: parseInt(lowStockAlert, 10) || 10,
        prescriptionRequired: rxRequired,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
        expiryDate: '2027-12-31',
      });
    }

    setAddModalVisible(false);
  };

  const renderProductItem = ({ item }: { item: PharmacyProduct }) => {
    const isLowStock = item.stockQuantity <= item.lowStockAlert;
    const isOutOfStock = item.stockQuantity === 0;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemRow}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.nameActionRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable onPress={() => openEditModal(item)}>
                <Ionicons name="create-outline" size={17} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={styles.itemBrand}>Brand: {item.brand}</Text>
            <Text style={styles.itemFormula} numberOfLines={1}>
              Active: {item.formula}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{item.category.toUpperCase()}</Text>
              </View>
              {item.prescriptionRequired && (
                <View style={styles.rxRequiredPill}>
                  <Text style={styles.rxRequiredText}>Rx Required</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stock & Price Bar */}
        <View style={styles.stockPriceBar}>
          <View>
            <Text style={styles.priceText}>₹{item.price}</Text>
            <Text style={styles.expiryText}>Exp: {item.expiryDate}</Text>
          </View>

          <View style={styles.stockStatusCol}>
            <View
              style={[
                styles.stockBadge,
                isOutOfStock
                  ? { backgroundColor: colors.dangerLight }
                  : isLowStock
                  ? { backgroundColor: colors.warningLight }
                  : { backgroundColor: colors.successLight },
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  isOutOfStock
                    ? { color: colors.danger }
                    : isLowStock
                    ? { color: colors.warning }
                    : { color: colors.success },
                ]}
              >
                {isOutOfStock
                  ? 'OUT OF STOCK'
                  : isLowStock
                  ? `LOW STOCK (${item.stockQuantity})`
                  : `In Stock: ${item.stockQuantity} units`}
              </Text>
            </View>

            <Pressable
              style={styles.restockBtn}
              onPress={() => {
                setSelectedItemForRestock(item);
                setRestockModalVisible(true);
              }}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text style={styles.restockBtnText}>Quick Restock</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              (navigation as any).navigate('Main');
            }
          }}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Pharmacy Inventory</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Medicines & clinical equipment catalog</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            style={styles.bulkBtn}
            onPress={() => {
              // Quick mock bulk inventory sync
            }}
          >
            <Ionicons name="cloud-upload-outline" size={15} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Item</Text>
          </Pressable>
        </View>
      </View>

      {/* Low Stock Warning Alert if any */}
      {lowStockItems.length > 0 && (
        <View style={styles.lowStockBanner}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.lowStockBannerText}>
            <Text style={{ fontWeight: '800' }}>{lowStockItems.length} items</Text> are critically low or out of stock! Restock now to avoid order cancellations.
          </Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by medicine, brand or formula composition..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category Filter Chips */}
      <View style={{ height: 42 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Inventory Items List */}
      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Inventory Items Found</Text>
          </View>
        }
      />

      {/* Quick Restock Modal */}
      <Modal visible={restockModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Restock</Text>
              <Pressable onPress={() => setRestockModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Item: <Text style={{ fontWeight: '700' }}>{selectedItemForRestock?.name}</Text>
            </Text>
            <Text style={styles.modalSub}>
              Current Stock: {selectedItemForRestock?.stockQuantity} units
            </Text>

            <Text style={styles.inputLabel}>Units to Add to Inventory</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={restockQtyInput}
              onChangeText={setRestockQtyInput}
              placeholder="e.g. 50"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setRestockModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.pharmacyTeal }]}
                onPress={() => {
                  const qty = parseInt(restockQtyInput, 10);
                  if (selectedItemForRestock && !isNaN(qty) && qty > 0) {
                    restockProduct(selectedItemForRestock.id, qty);
                    setRestockModalVisible(false);
                  }
                }}
              >
                <Text style={styles.submitBtnText}>Confirm Restock</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Product Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Medicine / Item' : 'Add Item to Pharmacy'}
              </Text>
              <Pressable onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Dolo 650mg, BD Insulin Needles"
              />

              <Text style={styles.inputLabel}>Manufacturer / Brand</Text>
              <TextInput
                style={styles.modalInput}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g. Micro Labs, Cipla, Becton Dickinson"
              />

              <Text style={styles.inputLabel}>Active Formula / Chemical Composition</Text>
              <TextInput
                style={styles.modalInput}
                value={formula}
                onChangeText={setFormula}
                placeholder="e.g. Paracetamol 650mg, 31G 4mm Needle"
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Low Stock Alert</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={lowStockAlert}
                    onChangeText={setLowStockAlert}
                  />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', marginTop: 16 }}>
                  <Pressable
                    style={[
                      styles.rxCheckBtn,
                      rxRequired && { backgroundColor: colors.pharmacyTealLight },
                    ]}
                    onPress={() => setRxRequired(!rxRequired)}
                  >
                    <Ionicons
                      name={rxRequired ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={rxRequired ? colors.pharmacyTeal : colors.textMuted}
                    />
                    <Text style={styles.rxCheckText}>Rx Required</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setAddModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: colors.pharmacyTeal }]}
                  onPress={handleSaveProduct}
                >
                  <Text style={styles.submitBtnText}>Save Product</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 56,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  bulkBtn: {
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pharmacyTeal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger + '30',
  },
  lowStockBannerText: {
    flex: 1,
    fontSize: 11,
    color: colors.danger,
    lineHeight: 15,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  categoryChipsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 6,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryChipActive: {
    backgroundColor: colors.pharmacyTeal,
    borderColor: colors.pharmacyTeal,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  nameActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  itemBrand: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemFormula: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rxRequiredPill: {
    backgroundColor: colors.hospitalRedLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  rxRequiredText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.hospitalRed,
  },
  stockPriceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs + 4,
    marginTop: spacing.sm,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  expiryText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  stockStatusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  restockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.pharmacyTeal,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  restockBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.background,
  },
  rxCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.sm,
  },
  rxCheckText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
