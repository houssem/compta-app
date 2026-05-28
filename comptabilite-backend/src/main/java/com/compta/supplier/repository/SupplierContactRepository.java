package com.compta.supplier.repository;

import com.compta.supplier.entity.SupplierContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface SupplierContactRepository extends JpaRepository<SupplierContact, UUID> {

    List<SupplierContact> findAllBySupplierIdOrderByPrimaryDesc(UUID supplierId);

    @Transactional
    @Modifying
    @Query("DELETE FROM SupplierContact c WHERE c.supplierId = :supplierId")
    void deleteAllBySupplierId(UUID supplierId);
}
