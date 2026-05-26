package com.compta.invoice.repository;

import com.compta.invoice.entity.InvoiceSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, InvoiceSequence.InvoiceSequenceId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM InvoiceSequence s WHERE s.companyId = :companyId AND s.year = :year AND s.month = :month")
    Optional<InvoiceSequence> findForUpdate(@Param("companyId") UUID companyId,
                                            @Param("year") int year,
                                            @Param("month") int month);
}
