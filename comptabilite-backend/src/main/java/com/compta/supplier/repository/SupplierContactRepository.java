package com.compta.supplier.repository;

import com.compta.common.ContactRepository;
import org.springframework.stereotype.Repository;

/**
 * Supplier-scoped view of the unified {@code contacts} table.
 * All queries are inherited from {@link ContactRepository}.
 */
@Repository
public interface SupplierContactRepository extends ContactRepository {
}
